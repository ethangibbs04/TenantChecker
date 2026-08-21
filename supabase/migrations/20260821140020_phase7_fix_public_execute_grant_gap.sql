-- Security fix, found while testing expire_stale_checks(): `revoke
-- execute ... from authenticated, anon` does NOT actually restrict a
-- function to service_role. Postgres auto-grants EXECUTE to the PUBLIC
-- pseudo-role on function creation, and authenticated/anon both inherit
-- from PUBLIC regardless of what's revoked from them individually — the
-- original revoke statements (this file's and mark_paid()'s, from the
-- Phase 0 schema) never touched that PUBLIC grant, so both functions
-- were still callable by any authenticated (or even anonymous) client.
-- For mark_paid() specifically, that meant anyone could POST to its RPC
-- endpoint and fraudulently mark any check as paid without ever going
-- through PayFast. Revoking from PUBLIC actually removes the grant.

revoke execute on function public.mark_paid(uuid, text, numeric, jsonb) from public;
revoke execute on function public.expire_stale_checks() from public;
