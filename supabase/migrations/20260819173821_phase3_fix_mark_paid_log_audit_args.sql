-- Bug: mark_paid() called log_audit(null, 'check.payment_confirmed', ...)
-- but log_audit's signature is (p_action, p_entity_type, p_entity_id,
-- p_metadata) — action and entity_type were swapped, so `null` landed in
-- the NOT NULL `action` column and every real PayFast ITN callback
-- failed with a 500. Caught by actually completing a sandbox payment.

create or replace function public.mark_paid(
  p_check_id uuid,
  p_provider_payment_id text,
  p_amount numeric,
  p_raw_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.check_status(p_check_id) <> 'AWAITING_PAYMENT' then
    raise exception 'check is not awaiting payment';
  end if;

  update public.payments
  set status = 'paid',
      provider_payment_id = p_provider_payment_id,
      amount = p_amount,
      raw_webhook_payload = p_raw_payload,
      paid_at = now()
  where check_id = p_check_id;

  update public.checks set status = 'AWAITING_APPLICATION' where id = p_check_id;

  perform public.log_audit('check.payment_confirmed', 'check', p_check_id, p_raw_payload);
end;
$$;

revoke execute on function public.mark_paid(uuid, text, numeric, jsonb) from authenticated, anon;
grant execute on function public.mark_paid(uuid, text, numeric, jsonb) to service_role;
