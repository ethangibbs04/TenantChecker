-- Fix: create_check() never created the `payments` row that mark_paid()
-- later UPDATEs — it would silently affect zero rows. Create it up front.
--
-- application_forms is handled differently: its tenant_id is NOT NULL,
-- and the tenant isn't known until accept_invite() runs, so that row is
-- created there instead (also fixed here — it had the same missing-row
-- bug for submit_application()).

create or replace function public.create_check(
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
  v_price constant numeric(10,2) := 350.00;
begin
  if not exists (select 1 from public.properties where id = p_property_id and landlord_id = auth.uid()) then
    raise exception 'not the landlord of this property';
  end if;

  insert into public.checks (property_id, landlord_id, tenant_full_name, tenant_email, tenant_phone)
  values (p_property_id, auth.uid(), p_tenant_full_name, p_tenant_email, p_tenant_phone)
  returning id into v_check_id;

  insert into public.check_invites (check_id, token, expires_at)
  values (v_check_id, encode(gen_random_bytes(32), 'hex'), now() + interval '7 days');

  insert into public.payments (check_id, landlord_id, amount)
  values (v_check_id, auth.uid(), v_price);

  perform public.log_audit('check.created', 'check', v_check_id);
  return v_check_id;
end;
$$;

create or replace function public.accept_invite(p_token text)
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

  insert into public.application_forms (check_id, tenant_id)
  values (v_check_id, auth.uid())
  on conflict (check_id) do nothing;

  insert into public.user_roles (user_id, role) values (auth.uid(), 'tenant')
  on conflict do nothing;

  perform public.log_audit('check.invite_accepted', 'check', v_check_id);
  return v_check_id;
end;
$$;
