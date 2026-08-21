import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Role = "landlord" | "tenant" | "admin";

export function getDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  return typeof fullName === "string" && fullName.trim() ? fullName : (user.email ?? "");
}

export async function getCurrentUserAndRoles() {
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
}

// Grants the landlord role if the user doesn't already have it. Idempotent —
// safe to call on every sign-in/sign-up that's headed to a /landlord route,
// so a first-time visitor who arrives via a landlord-gated CTA (e.g. "Buy
// Tenantcheck") doesn't get bounced by the /landlord layout guard for
// lacking a role nobody ever explicitly granted them.
export async function ensureLandlordRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "landlord")
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role: "landlord" });

  // 23505 = unique_violation: another concurrent call already granted it
  // (user_roles has a (user_id, role) primary key) — already idempotent.
  if (error && error.code !== "23505") throw new Error(error.message);
}
