"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: user.id, role: "landlord" });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/landlord");
}
