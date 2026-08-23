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

export function getDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  return typeof fullName === "string" && fullName.trim() ? fullName : (user.email ?? "");
}
