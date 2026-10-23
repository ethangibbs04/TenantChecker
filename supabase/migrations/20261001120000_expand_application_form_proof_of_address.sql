-- Expands the tenant application form's required documents to include
-- proof of current address, alongside the existing id_copy/payslip/
-- bank_statement set (see src/lib/application-form.ts for the full field/
-- document redesign this backs). Three things reference the fixed
-- document_type list and all need updating together: the table's own CHECK
-- constraint, the tenant insert RLS policy, and submit_application()'s
-- required-document guard.

alter table public.documents
  drop constraint if exists documents_document_type_check;

alter table public.documents
  add constraint documents_document_type_check check (document_type in (
    'credit_check', 'id_copy', 'payslip', 'bank_statement', 'proof_of_address',
    'ai_recommendation', 'other'
  ));

drop policy if exists "documents_insert_tenant_own_check" on public.documents;
create policy "documents_insert_tenant_own_check" on public.documents
  for insert with check (
    uploaded_by = auth.uid()
    and document_type in ('id_copy', 'payslip', 'bank_statement', 'proof_of_address')
    and public.is_tenant_of_check(check_id)
    and public.check_status(check_id) = 'AWAITING_APPLICATION'
  );

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
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'proof_of_address') then
    raise exception 'missing proof of address document';
  end if;

  update public.application_forms
  set form_data = p_form_data, status = 'submitted', submitted_at = now()
  where check_id = p_check_id;

  update public.checks set status = 'PROCESSING' where id = p_check_id;

  perform public.log_audit('check.application_submitted', 'check', p_check_id);
end;
$$;
