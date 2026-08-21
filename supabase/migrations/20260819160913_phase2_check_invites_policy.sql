-- The landlord who created a check needs to read the invite link so they
-- can share it manually (email/WhatsApp automation lands in Phase 7).
-- Note: this is not a new trust boundary — the landlord already has the
-- tenant's email/phone from check creation, and nothing in the product
-- flow prevents a landlord from forwarding the link themselves either
-- way. Tenants and anon users still can't read this table directly; they
-- only ever reach it through get_check_by_invite_token()/accept_invite().
create policy "check_invites_select_landlord_or_admin" on public.check_invites
  for select using (
    public.is_landlord_of_check(check_id) or public.is_admin()
  );
