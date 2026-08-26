import { createClient } from "@/lib/supabase/client";
import { getDisplayName, type Role } from "@/lib/roles";

export type PostAuthChoice = { roles: Role[]; userLabel: string };

export type PostAuthResolution =
  | { type: "redirect"; to: string }
  | { type: "choice"; choice: PostAuthChoice };

// Called after a successful sign-in/sign-up that had no specific destination
// in mind (the plain header "Log in"/"Sign up", not a gated CTA that already
// knows where it wants to send you). A single role means there's an obvious
// answer — go straight there. Zero roles means the visitor is just
// "pending" — nobody is a landlord or tenant until they've actually bought
// a Tenantcheck or had one run on them — so there's nothing to choose
// between; they land on the homepage like anyone else. Only when someone
// holds more than one role (e.g. landlord who has since also had a check
// run on them as a tenant) is there real ambiguity, so the caller (the auth
// dialog) gets the roles back to show a "choose a dashboard" step in place.
export async function resolveAmbiguousDestination(): Promise<PostAuthResolution> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { type: "redirect", to: "/" };

  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (data ?? []).map((r) => r.role as Role);

  if (roles.length === 0) return { type: "redirect", to: "/" };
  if (roles.length === 1) return { type: "redirect", to: `/${roles[0]}` };

  return { type: "choice", choice: { roles, userLabel: getDisplayName(user) } };
}
