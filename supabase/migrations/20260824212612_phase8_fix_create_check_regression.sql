-- Fixes a regression introduced by the previous migration
-- (20260824211244_phase8_grant_landlord_role_on_check_creation.sql): it
-- rewrote create_check() from the original init_schema.sql version and
-- unintentionally reverted two later fixes that had already landed on top
-- of it:
--   - 20260819161302: gen_random_bytes() must be schema-qualified as
--     extensions.gen_random_bytes() (pgcrypto lives in the `extensions`
--     schema, not `public`, which this function's search_path is
--     restricted to) — without it, buying a Tenantcheck failed outright
--     with "function gen_random_bytes(integer) does not exist".
--   - 20260819160543: create_check() must create the `payments` row up
--     front (mark_paid() only UPDATEs an existing row; with none created,
--     payment confirmation would silently affect zero rows).
-- Restoring both, on top of the landlord-role grant.
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

  insert into public.user_roles (user_id, role) values (auth.uid(), 'landlord')
  on conflict do nothing;

  insert into public.checks (property_id, landlord_id, tenant_full_name, tenant_email, tenant_phone)
  values (p_property_id, auth.uid(), p_tenant_full_name, p_tenant_email, p_tenant_phone)
  returning id into v_check_id;

  insert into public.check_invites (check_id, token, expires_at)
  values (v_check_id, encode(extensions.gen_random_bytes(32), 'hex'), now() + interval '7 days');

  insert into public.payments (check_id, landlord_id, amount)
  values (v_check_id, auth.uid(), v_price);

  perform public.log_audit('check.created', 'check', v_check_id);
  return v_check_id;
end;
$$;
