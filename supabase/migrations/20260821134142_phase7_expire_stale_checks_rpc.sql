-- Phase 7: expires checks that never made it past consent/payment within
-- their invite window. A check is stale once its (one-time, 7-day)
-- check_invites row has expired while checks.status is still
-- AWAITING_CONSENT or AWAITING_PAYMENT — covering both "tenant never
-- consented" and "landlord never paid" (the invite window is treated as
-- the deadline for the whole pre-application phase, not just consent).
--
-- No actor context here (this runs off a schedule, not a logged-in
-- user), so it's restricted to service_role only, same treatment as
-- mark_paid() — the trusted /api/cron/process-expirations route calls it
-- with the service-role client. See Plan.md Phase 7 for why the
-- schedule itself is a Next.js route rather than pg_cron/pg_net: it
-- keeps the Resend API key in one place (Vercel env, not Postgres) for
-- the reminder-email half of the same job.

create function public.expire_stale_checks()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_id uuid;
begin
  for v_check_id in
    select c.id
    from public.checks c
    join public.check_invites ci on ci.check_id = c.id
    where c.status in ('AWAITING_CONSENT', 'AWAITING_PAYMENT')
      and ci.expires_at < now()
  loop
    update public.checks set status = 'EXPIRED' where id = v_check_id;
    perform public.log_audit('check.expired', 'check', v_check_id);
    return next v_check_id;
  end loop;
  return;
end;
$$;

revoke execute on function public.expire_stale_checks() from authenticated, anon;
grant execute on function public.expire_stale_checks() to service_role;
