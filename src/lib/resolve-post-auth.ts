import { createClient } from "@/lib/supabase/client";
import { getDisplayName, type Role } from "@/lib/roles";

export type PostAuthChoice = { roles: Role[]; userLabel: string };

export type PostAuthResolution =
  | { type: "redirect"; to: string }
  | { type: "choice"; choice: PostAuthChoice };

// Called after a successful sign-in/sign-up that had no specific destination
// in mind (the plain header "Log in"/"Sign up", not a gated CTA that already
// knows where it wants to send you). A single role means there's an obvious
// answer — go straight there, same as the old server-side page.tsx redirect.
// Zero or multiple roles means there isn't one, so the caller (the auth
// dialog) gets the roles back to show a "choose a dashboard" / "claim
// landlord" step in place, instead of navigating to a separate page.
export async function resolveAmbiguousDestination(): Promise<PostAuthResolution> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { type: "redirect", to: "/" };

  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (data ?? []).map((r) => r.role as Role);

  if (roles.length === 1) return { type: "redirect", to: `/${roles[0]}` };

  return { type: "choice", choice: { roles, userLabel: getDisplayName(user) } };
}
