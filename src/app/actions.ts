"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureLandlordRole } from "@/lib/auth";
import { redirect } from "next/navigation";

// Called right after a successful login/signup that's headed to a
// /landlord route (e.g. the "Buy Tenantcheck" gate), so the visitor lands
// on their intended page instead of being bounced by the route guard for
// lacking a role nobody explicitly granted them. No-op, no redirect — just
// makes sure the role exists before the client navigates on.
export async function ensureLandlordRoleForDestination(destination: string) {
  if (!destination.startsWith("/landlord")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await ensureLandlordRole(supabase, user.id);
}

// Self-serve landlord signup. Tenants never hit this path — they're
// assigned the 'tenant' role by accept_invite() when they follow an
// invite link (see Phase 3), which the "landlord_id" RLS grant doesn't
// permit them to reach on their own.
export async function claimLandlordRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureLandlordRole(supabase, user.id);

  redirect("/landlord");
}
