-- Role model change: nobody is a landlord or tenant just by signing up.
-- 'landlord' is granted as a side effect of actually buying a Tenantcheck
-- (create_check), the same way 'tenant' is already granted as a side
-- effect of accepting an invite (accept_invite) rather than through any
-- separate "claim a role" step. This keeps role transitions atomic with
-- the state-machine action that earns them, instead of a client-side
-- pre-grant racing the route guard that depends on it.
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
begin
  if not exists (select 1 from public.properties where id = p_property_id and landlord_id = auth.uid()) then
    raise exception 'not the landlord of this property';
  end if;

  insert into public.user_roles (user_id, role) values (auth.uid(), 'landlord')
  on conflict do nothing;

  insert into public.checks (property_id, landlord_id, tenant_full_name, tenant_email, tenant_phone)
  values (p_property_id, auth.uid(), p_tenant_full_name, p_tenant_email, p_tenant_phone)
  returning id into v_check_id;

  insert into public.check_invites (check_id, token, expires_at)
  values (v_check_id, encode(gen_random_bytes(32), 'hex'), now() + interval '7 days');

  perform public.log_audit('check.created', 'check', v_check_id);
  return v_check_id;
end;
$$;
