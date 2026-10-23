-- Expands the tenant application form's document set to match the new
-- 1:1 field redesign (see src/lib/application-form.ts): two new
-- document_type values — 'employment_contract' (satisfies the "payslip or
-- employment contract" requirement when 3 months of payslips aren't
-- available) and 'application_form' (a PDF snapshot of the whole
-- submitted form, generated and uploaded at submission time, stored
-- alongside the existing form_data jsonb — not a replacement for it,
-- client decision to keep both and manage form_data's retention/TTL
-- separately).

alter table public.documents
  drop constraint if exists documents_document_type_check;

alter table public.documents
  add constraint documents_document_type_check check (document_type in (
    'credit_check', 'id_copy', 'payslip', 'bank_statement', 'proof_of_address',
    'employment_contract', 'application_form', 'ai_recommendation', 'other'
  ));

drop policy if exists "documents_insert_tenant_own_check" on public.documents;
create policy "documents_insert_tenant_own_check" on public.documents
  for insert with check (
    uploaded_by = auth.uid()
    and document_type in (
      'id_copy', 'payslip', 'bank_statement', 'proof_of_address',
      'employment_contract', 'application_form'
    )
    and public.is_tenant_of_check(check_id)
    and public.check_status(check_id) = 'AWAITING_APPLICATION'
  );

-- `ship_check()` is the only place is_package_document ever flips to true
-- — the generated application-form PDF ships to the landlord alongside
-- the credit check and AI recommendation; the tenant's raw source
-- documents (ID, payslips, bank statements, proof of address, employment
-- contract) stay admin/tenant-only forever, same privacy model as before.
create or replace function public.ship_check(p_check_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'only admins may ship a check';
  end if;
  if public.check_status(p_check_id) <> 'PROCESSING' then
    raise exception 'check is not ready to ship';
  end if;
  if not exists (
    select 1 from public.documents
    where check_id = p_check_id and document_type = 'credit_check'
  ) then
    raise exception 'missing credit check document';
  end if;
  if not exists (
    select 1 from public.documents
    where check_id = p_check_id and document_type = 'ai_recommendation'
  ) then
    raise exception 'missing AI recommendation document';
  end if;

  update public.documents
  set is_package_document = true
  where check_id = p_check_id and document_type in ('credit_check', 'ai_recommendation', 'application_form');

  update public.checks
  set status = 'COMPLETED', shipped_at = now(), shipped_by = auth.uid()
  where id = p_check_id;

  perform public.log_audit('check.shipped', 'check', p_check_id);
end;
$$;

-- Same (p_check_id, p_form_data) signature as before — still writes
-- form_data jsonb — plus two new required-document checks: proof of
-- address, and the generated application_form PDF itself (uploaded by
-- the client right before calling this RPC).
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
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'bank_statement') then
    raise exception 'missing bank statement document';
  end if;
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'proof_of_address') then
    raise exception 'missing proof of address document';
  end if;
  if not exists (
    select 1 from public.documents
    where check_id = p_check_id and document_type in ('payslip', 'employment_contract')
  ) then
    raise exception 'missing payslip or employment contract document';
  end if;
  if not exists (select 1 from public.documents where check_id = p_check_id and document_type = 'application_form') then
    raise exception 'missing generated application form document';
  end if;

  update public.application_forms
  set form_data = p_form_data, status = 'submitted', submitted_at = now()
  where check_id = p_check_id;

  update public.checks set status = 'PROCESSING' where id = p_check_id;

  perform public.log_audit('check.application_submitted', 'check', p_check_id);
end;
$$;
