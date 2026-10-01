import type { User } from "@supabase/supabase-js";

// Deliberately no server-only imports here (no next/headers, no Supabase
// server client) — this file needs to be importable from client components
// (the auth dialog resolves role choices client-side after sign-in), not
// just server code.

export type Role = "landlord" | "tenant" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  landlord: "Landlord",
  tenant: "Tenant",
  admin: "Admin",
};

// Extra nav items each role adds to the site header once a user holding
// that role is logged in — shown everywhere, not just inside that role's
// own route tree, so switching to a marketing tab doesn't hide them.
export const ROLE_NAV_ITEMS: Record<Role, { label: string; href: string }[]> = {
  landlord: [
    { label: "My Activity", href: "/landlord" },
    { label: "Properties", href: "/landlord/properties" },
  ],
  tenant: [{ label: "My Activity", href: "/tenant" }],
  admin: [{ label: "Admin Dashboard", href: "/admin" }],
};

// Landlord/tenant show a plain "something needs you" dot on "My Activity"
// (client-approved, deliberately no count). Admin explicitly wanted the
// queue depth as a number — "needs review" is naturally a small integer,
// not just a yes/no — so only admin's item gets a numbered pill instead.
const NUMBERED_BADGE_ROLES: Role[] = ["admin"];

export type RoleNavItem = {
  label: string;
  href: string;
  hasPendingAction?: boolean;
  pendingCount?: number;
};

function navItemsFor(role: Role, pendingActionCounts?: Partial<Record<Role, number>>): RoleNavItem[] {
  const count = pendingActionCounts?.[role];
  return ROLE_NAV_ITEMS[role].map((item) => {
    // `pendingActionCounts` only ever lights up a role's own dashboard-root
    // item (`/landlord`, `/tenant`, `/admin`), never a secondary item like
    // "Properties".
    const isDashboardRoot = item.href === `/${role}`;
    return {
      ...item,
      hasPendingAction: isDashboardRoot && !!count,
      pendingCount: isDashboardRoot && NUMBERED_BADGE_ROLES.includes(role) ? count : undefined,
    };
  });
}

// Every role's own dashboard-root nav item is labeled "My Activity" — fine
// when only one role's items are ever shown at once, but showing every
// role's items side by side for a multi-role user renders that label twice
// with no way to tell them apart. So: inside a specific role's dashboard
// (`activeRole` set), show only that role's items. Outside any dashboard
// (marketing pages), show a single role's items only when there's no
// ambiguity about which one — i.e. the user holds exactly one role;
// multi-role visitors use `UserMenu`'s "Go to X dashboard" instead.
export function getRoleNavItems(
  roles: Role[],
  pendingActionCounts?: Partial<Record<Role, number>>,
  activeRole?: Role
): RoleNavItem[] {
  if (activeRole) return navItemsFor(activeRole, pendingActionCounts);
  if (roles.length === 1) return navItemsFor(roles[0], pendingActionCounts);
  return [];
}

export function getDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  return typeof fullName === "string" && fullName.trim() ? fullName : (user.email ?? "");
}
