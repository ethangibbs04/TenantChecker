-- Expose tenant_email on the invite preview so the invite page can warn
-- when the person opening the link is already signed in as someone else
-- (e.g. the landlord's own browser session, or a different account
-- entirely) instead of silently offering to accept the invite as
-- whichever account happens to be logged in.
drop function if exists public.get_check_by_invite_token(text);

create function public.get_check_by_invite_token(p_token text)
returns table (
  check_id uuid,
  tenant_full_name text,
  tenant_email text,
  property_label text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.tenant_full_name, c.tenant_email, p.label, c.status
  from public.check_invites ci
  join public.checks c on c.id = ci.check_id
  join public.properties p on p.id = c.property_id
  where ci.token = p_token
    and ci.used_at is null
    and ci.expires_at > now();
$$;
