-- Tenantcheck MVP: initial schema, RLS policies, and state-machine RPCs.
-- See /Users/ethangibbons/.claude/plans/act-as-an-expert-parallel-wand.md for the design rationale.

create extension if not exists pgcrypto;

-- =========================================================================
-- 1. TABLES
-- =========================================================================

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  id_number   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.user_roles (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  role     text not null check (role in ('landlord', 'tenant', 'admin')),
  primary key (user_id, role)
);

create table public.properties (
  id             uuid primary key default gen_random_uuid(),
  landlord_id    uuid not null references public.profiles (id) on delete cascade,
  label          text not null,
  address_line1  text not null,
  address_line2  text,
  city           text,
  province       text,
  postal_code    text,
  created_at     timestamptz not null default now()
);

create table public.checks (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references public.properties (id) on delete restrict,
  landlord_id      uuid not null references public.profiles (id) on delete restrict,
  tenant_id        uuid references public.profiles (id) on delete set null,
  tenant_full_name text not null,
  tenant_email     text not null,
  tenant_phone     text,
  status           text not null default 'AWAITING_CONSENT' check (status in (
                      'AWAITING_CONSENT', 'AWAITING_PAYMENT', 'AWAITING_APPLICATION',
                      'PROCESSING', 'COMPLETED', 'DECLINED', 'CANCELLED', 'EXPIRED'
                   )),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  shipped_at       timestamptz,
  shipped_by       uuid references public.profiles (id)
);

create index checks_landlord_id_idx on public.checks (landlord_id);
create index checks_tenant_id_idx on public.checks (tenant_id);
create index checks_property_id_idx on public.checks (property_id);

create table public.check_invites (
  id          uuid primary key default gen_random_uuid(),
  check_id    uuid not null references public.checks (id) on delete cascade,
  token       text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table public.consents (
  id                     uuid primary key default gen_random_uuid(),
  check_id               uuid not null references public.checks (id) on delete cascade,
  tenant_id              uuid not null references public.profiles (id),
  consent_version        text not null,
  consent_text_snapshot  text not null,
  signed_at              timestamptz not null default now(),
  ip_address             inet,
  user_agent             text,
  created_at             timestamptz not null default now()
);

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  check_id              uuid not null unique references public.checks (id) on delete cascade,
  landlord_id           uuid not null references public.profiles (id),
  amount                numeric(10, 2) not null,
  currency              text not null default 'ZAR',
  provider              text not null default 'payfast',
  provider_payment_id   text unique,
  status                text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  raw_webhook_payload   jsonb,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

create table public.application_forms (
  id             uuid primary key default gen_random_uuid(),
  check_id       uuid not null unique references public.checks (id) on delete cascade,
  tenant_id      uuid not null references public.profiles (id),
  form_data      jsonb not null default '{}'::jsonb,
  status         text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.documents (
  id                   uuid primary key default gen_random_uuid(),
  check_id             uuid not null references public.checks (id) on delete cascade,
  document_type        text not null check (document_type in (
                          'credit_check', 'id_copy', 'payslip', 'bank_statement',
                          'ai_recommendation', 'other'
                       )),
  uploaded_by          uuid not null references public.profiles (id),
  storage_path         text not null,
  file_name            text not null,
  mime_type            text,
  file_size_bytes      bigint,
  is_package_document  boolean not null default false,
  created_at           timestamptz not null default now()
);

create index documents_check_id_idx on public.documents (check_id);

create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id),
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  check_id      uuid references public.checks (id) on delete cascade,
  recipient_id  uuid references public.profiles (id),
  channel       text not null check (channel in ('email', 'whatsapp')),
  template      text not null,
  status        text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- =========================================================================
-- 2. HOUSEKEEPING TRIGGERS
-- =========================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.checks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.application_forms
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth.users row is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- 3. RLS HELPER FUNCTIONS (security definer, avoid recursive RLS)
-- =========================================================================

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_landlord_of_check(p_check_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.checks
    where id = p_check_id and landlord_id = auth.uid()
  );
$$;

create function public.is_tenant_of_check(p_check_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.checks
    where id = p_check_id and tenant_id = auth.uid()
  );
$$;

create function public.check_status(p_check_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select status from public.checks where id = p_check_id;
$$;

create function public.log_audit(p_action text, p_entity_type text, p_entity_id uuid, p_metadata jsonb default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
$$;

-- =========================================================================
-- 4. ENABLE RLS
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.properties enable row level security;
alter table public.checks enable row level security;
alter table public.check_invites enable row level security;
alter table public.consents enable row level security;
alter table public.payments enable row level security;
alter table public.application_forms enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;

-- =========================================================================
-- 5. RLS POLICIES
-- =========================================================================

-- profiles: users manage their own row; admins see everyone.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- user_roles: users see their own roles; only admins/service role assign roles.
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());
create policy "user_roles_self_signup_landlord" on public.user_roles
  for insert with check (user_id = auth.uid() and role = 'landlord');

-- properties: landlords manage their own; admins see everything.
create policy "properties_select_own_or_admin" on public.properties
  for select using (landlord_id = auth.uid() or public.is_admin());
create policy "properties_insert_own" on public.properties
  for insert with check (landlord_id = auth.uid());
create policy "properties_update_own" on public.properties
  for update using (landlord_id = auth.uid());
create policy "properties_delete_own" on public.properties
  for delete using (landlord_id = auth.uid());

-- checks: visible to the landlord who owns it, the linked tenant, or admins.
-- No client-side UPDATE policy: every status transition goes through the
-- SECURITY DEFINER RPCs below so the state machine can't be bypassed.
create policy "checks_select_participant_or_admin" on public.checks
  for select using (
    landlord_id = auth.uid() or tenant_id = auth.uid() or public.is_admin()
  );

-- check_invites: no direct client access; only reachable via the
-- get_check_by_invite_token / accept_invite RPCs below.

-- consents: tenant can see their own; admin sees all. Inserted only via submit_consent().
create policy "consents_select_own_or_admin" on public.consents
  for select using (tenant_id = auth.uid() or public.is_admin());

-- payments: landlord sees their own; admin sees all. Written only by the
-- service role (PayFast webhook handler), which bypasses RLS entirely.
create policy "payments_select_own_or_admin" on public.payments
  for select using (landlord_id = auth.uid() or public.is_admin());

-- application_forms: tenant can view/edit their own draft; landlord can only
-- view once the check is COMPLETED; admin sees all.
create policy "application_forms_select_tenant_own" on public.application_forms
  for select using (tenant_id = auth.uid());
create policy "application_forms_select_landlord_completed" on public.application_forms
  for select using (
    public.is_landlord_of_check(check_id) and public.check_status(check_id) = 'COMPLETED'
  );
create policy "application_forms_select_admin" on public.application_forms
  for select using (public.is_admin());
create policy "application_forms_update_tenant_draft" on public.application_forms
  for update using (tenant_id = auth.uid() and status = 'draft');

-- documents: the core "withhold until Ship" enforcement.
create policy "documents_select_admin" on public.documents
  for select using (public.is_admin());
create policy "documents_select_landlord_completed_package" on public.documents
  for select using (
    is_package_document = true
    and public.is_landlord_of_check(check_id)
    and public.check_status(check_id) = 'COMPLETED'
  );
create policy "documents_select_tenant_own_uploads" on public.documents
  for select using (
    uploaded_by = auth.uid()
    and document_type not in ('credit_check', 'ai_recommendation')
  );
create policy "documents_insert_tenant_own_check" on public.documents
  for insert with check (
    uploaded_by = auth.uid()
    and document_type in ('id_copy', 'payslip', 'bank_statement')
    and public.is_tenant_of_check(check_id)
    and public.check_status(check_id) = 'AWAITING_APPLICATION'
  );
create policy "documents_insert_admin" on public.documents
  for insert with check (public.is_admin());

-- audit_log: admin-only read; writes happen via log_audit() / RPCs.
create policy "audit_log_select_admin" on public.audit_log
  for select using (public.is_admin());

-- notifications: recipients see their own; admin sees all.
create policy "notifications_select_own_or_admin" on public.notifications
  for select using (recipient_id = auth.uid() or public.is_admin());

-- =========================================================================
-- 6. STATE-MACHINE RPCs (SECURITY DEFINER — the only way `checks.status`
--    is allowed to change)
-- =========================================================================

create function public.create_check(
  p_property_id uuid,
  p_tenant_full_name text,
  p_tenant_email text,
  p_tenant_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_id uuid;
begin
  if not exists (select 1 from public.properties where id = p_property_id and landlord_id = auth.uid()) then
    raise exception 'not the landlord of this property';
  end if;

  insert into public.checks (property_id, landlord_id, tenant_full_name, tenant_email, tenant_phone)
  values (p_property_id, auth.uid(), p_tenant_full_name, p_tenant_email, p_tenant_phone)
  returning id into v_check_id;

  insert into public.check_invites (check_id, token, expires_at)
  values (v_check_id, encode(gen_random_bytes(32), 'hex'), now() + interval '7 days');

  perform public.log_audit('check.created', 'check', v_check_id);
  return v_check_id;
end;
$$;

create function public.get_check_by_invite_token(p_token text)
returns table (check_id uuid, tenant_full_name text, property_label text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.tenant_full_name, p.label, c.status
  from public.check_invites ci
  join public.checks c on c.id = ci.check_id
  join public.properties p on p.id = c.property_id
  where ci.token = p_token
    and ci.used_at is null
    and ci.expires_at > now();
$$;

create function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated to accept an invite';
  end if;

  select ci.check_id into v_check_id
  from public.check_invites ci
  where ci.token = p_token and ci.used_at is null and ci.expires_at > now()
  for update;

  if v_check_id is null then
    raise exception 'invite not found, already used, or expired';
  end if;

  update public.checks set tenant_id = auth.uid() where id = v_check_id and tenant_id is null;
  update public.check_invites set used_at = now() where token = p_token;

  insert into public.user_roles (user_id, role) values (auth.uid(), 'tenant')
  on conflict do nothing;

  perform public.log_audit('check.invite_accepted', 'check', v_check_id);
  return v_check_id;
end;
$$;

create function public.submit_consent(
  p_check_id uuid,
  p_consent_version text,
  p_consent_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tenant_of_check(p_check_id) then
    raise exception 'not the tenant of this check';
  end if;
  if public.check_status(p_check_id) <> 'AWAITING_CONSENT' then
    raise exception 'check is not awaiting consent';
  end if;

  insert into public.consents (check_id, tenant_id, consent_version, consent_text_snapshot, ip_address)
  values (p_check_id, auth.uid(), p_consent_version, p_consent_text, inet_client_addr());

  update public.checks set status = 'AWAITING_PAYMENT' where id = p_check_id;

  perform public.log_audit('check.consent_submitted', 'check', p_check_id);
end;
$$;

-- Called only by the PayFast ITN webhook handler running as the service
-- role (execute is revoked from authenticated/anon below).
create function public.mark_paid(
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

  perform public.log_audit(null, 'check.payment_confirmed', p_check_id, p_raw_payload);
end;
$$;

create function public.submit_application(p_check_id uuid, p_form_data jsonb)
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

  update public.application_forms
  set form_data = p_form_data, status = 'submitted', submitted_at = now()
  where check_id = p_check_id;

  update public.checks set status = 'PROCESSING' where id = p_check_id;

  perform public.log_audit('check.application_submitted', 'check', p_check_id);
end;
$$;

create function public.ship_check(p_check_id uuid)
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
  where check_id = p_check_id and document_type in ('credit_check', 'ai_recommendation');

  update public.checks
  set status = 'COMPLETED', shipped_at = now(), shipped_by = auth.uid()
  where id = p_check_id;

  perform public.log_audit('check.shipped', 'check', p_check_id);
end;
$$;

revoke execute on function public.mark_paid(uuid, text, numeric, jsonb) from authenticated, anon;
grant execute on function public.mark_paid(uuid, text, numeric, jsonb) to service_role;

-- =========================================================================
-- 7. STORAGE: private bucket for tenant documents
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('tenant-documents', 'tenant-documents', false)
on conflict (id) do nothing;

-- Object path convention: {check_id}/{document_type}/{filename}
-- Policies mirror the `documents` table policies above, keyed off the
-- first path segment (check_id) and the matching `documents` row.
create policy "storage_documents_select_admin" on storage.objects
  for select using (bucket_id = 'tenant-documents' and public.is_admin());

create policy "storage_documents_select_landlord_completed" on storage.objects
  for select using (
    bucket_id = 'tenant-documents'
    and exists (
      select 1 from public.documents d
      where d.storage_path = storage.objects.name
        and d.is_package_document = true
        and public.is_landlord_of_check(d.check_id)
        and public.check_status(d.check_id) = 'COMPLETED'
    )
  );

create policy "storage_documents_select_tenant_own" on storage.objects
  for select using (
    bucket_id = 'tenant-documents'
    and exists (
      select 1 from public.documents d
      where d.storage_path = storage.objects.name
        and d.uploaded_by = auth.uid()
        and d.document_type not in ('credit_check', 'ai_recommendation')
    )
  );

create policy "storage_documents_insert_tenant_own_check" on storage.objects
  for insert with check (
    bucket_id = 'tenant-documents'
    and public.is_tenant_of_check(((string_to_array(storage.objects.name, '/'))[1])::uuid)
    and public.check_status(((string_to_array(storage.objects.name, '/'))[1])::uuid) = 'AWAITING_APPLICATION'
  );

create policy "storage_documents_insert_admin" on storage.objects
  for insert with check (bucket_id = 'tenant-documents' and public.is_admin());
