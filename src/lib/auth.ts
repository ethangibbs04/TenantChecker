import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { type Role, getDisplayName } from "@/lib/roles";
import { LANDLORD_ACTIONABLE_STATUSES, TENANT_ACTIONABLE_STATUSES } from "@/lib/checks";

export type { Role };
export { getDisplayName };

// Feeds the little red dot on the "My Activity" nav item — how many of a
// role's checks are sitting in a status where the ball is in *their* court.
export type PendingActionCounts = Partial<Record<Role, number>>;

// Wrapped in React's cache() since the unified site header now calls this on
// every page (marketing and dashboard alike) — dedupes to one Supabase round
// trip per request even when a layout and a page both need it.
export const getCurrentUserAndRoles = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      roles: [] as Role[],
      pendingActionCounts: {} as PendingActionCounts,
      lastActiveRole: undefined as Role | undefined,
    };
  }

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (data ?? []).map((r) => r.role as Role);

  // Set by middleware whenever a request hits `/landlord`, `/tenant`, or
  // `/admin` — lets a neutral page (Home, Product, About, Contact) keep
  // showing the dashboard the visitor was last in instead of going blank
  // for a multi-role user. Re-validated against their actual roles on every
  // read since the cookie could be stale (roles changed) or, being a plain
  // cookie, not to be trusted as-is.
  const cookieStore = await cookies();
  const activeRoleCookie = cookieStore.get("active_role")?.value as Role | undefined;
  const lastActiveRole =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : undefined;

  const [landlordPending, tenantPending] = await Promise.all([
    roles.includes("landlord")
      ? supabase
          .from("checks")
          .select("id", { count: "exact", head: true })
          .eq("landlord_id", user.id)
          .in("status", LANDLORD_ACTIONABLE_STATUSES)
      : null,
    roles.includes("tenant")
      ? supabase
          .from("checks")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", user.id)
          .in("status", TENANT_ACTIONABLE_STATUSES)
      : null,
  ]);

  const pendingActionCounts: PendingActionCounts = {
    ...(landlordPending ? { landlord: landlordPending.count ?? 0 } : {}),
    ...(tenantPending ? { tenant: tenantPending.count ?? 0 } : {}),
  };

  return { user, roles, pendingActionCounts, lastActiveRole };
});
