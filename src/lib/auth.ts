import { createClient } from "@/lib/supabase/server";

export type Role = "landlord" | "tenant" | "admin";

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
