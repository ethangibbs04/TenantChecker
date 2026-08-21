-- Bug: create_check() calls gen_random_bytes(), but pgcrypto is installed
-- into the `extensions` schema (Supabase's default), while this function
-- restricts search_path to `public` — so the unqualified call resolved to
-- nothing. Schema-qualify it. (gen_random_uuid() never hit this because
-- table column defaults run under the session's search_path, not the
-- function's, so it was never actually exercised through this path.)

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
  values (v_check_id, encode(extensions.gen_random_bytes(32), 'hex'), now() + interval '7 days');

  insert into public.payments (check_id, landlord_id, amount)
  values (v_check_id, auth.uid(), v_price);

  perform public.log_audit('check.created', 'check', v_check_id);
  return v_check_id;
end;
$$;
