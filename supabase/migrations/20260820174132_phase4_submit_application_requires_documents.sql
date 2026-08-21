-- Bug (caught before shipping, not by a failed test this time): the
-- tenant application form requires uploading id_copy/payslip/bank_statement
-- in the UI, but submit_application() itself never checked for them — a
-- direct RPC call (or a client that skipped the upload step) could flip
-- the check to PROCESSING with zero supporting documents, and nothing
-- downstream would catch it. Mirrors the same guard ship_check() already
-- has for its own required documents.

create or replace function public.submit_application(p_check_id uuid, p_form_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tenant_of_check(p_check_id) then
    raise exception 'not the tenant of this check';
  end if;
  if public.check_status(p_check_id) <> 'AWAITING_APPLICATION' then
    raise exception 'check is not awaiting an application form';
  end if;
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'id_copy') then
    raise exception 'missing id copy document';
  end if;
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'payslip') then
    raise exception 'missing payslip document';
  end if;
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'bank_statement') then
    raise exception 'missing bank statement document';
  end if;

  update public.application_forms
  set form_data = p_form_data, status = 'submitted', submitted_at = now()
  where check_id = p_check_id;

  update public.checks set status = 'PROCESSING' where id = p_check_id;

  perform public.log_audit('check.application_submitted', 'check', p_check_id);
end;
$$;
