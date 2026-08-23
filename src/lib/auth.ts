import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { type Role, getDisplayName } from "@/lib/roles";

export type { Role };
export { getDisplayName };

// Wrapped in React's cache() since the unified site header now calls this on
// every page (marketing and dashboard alike) — dedupes to one Supabase round
// trip per request even when a layout and a page both need it.
export const getCurrentUserAndRoles = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, roles: [] as Role[] };

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return { user, roles: (data ?? []).map((r) => r.role as Role) };
});

// Grants the landlord role if the user doesn't already have it. Idempotent —
// safe to call on every sign-in/sign-up that's headed to a /landlord route,
// so a first-time visitor who arrives via a landlord-gated CTA (e.g. "Buy
// Tenantcheck") doesn't get bounced by the /landlord layout guard for
// lacking a role nobody ever explicitly granted them.
//
// Deliberately no "check if it exists first" step — that's a check-then-insert
// race (two requests can both pass the check before either inserts) and is
// exactly what produced a real "duplicate key value violates unique
// constraint user_roles_pkey" crash in testing. Postgres's own (user_id,
// role) primary key is the actual source of truth: just attempt the insert
// and treat "it already exists" as success, not a failure.
export async function ensureLandlordRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role: "landlord" });

  if (!error) return;

  const isDuplicate =
    error.code === "23505" || /duplicate key value/i.test(error.message ?? "");
  if (isDuplicate) return;

  throw new Error(error.message);
}
