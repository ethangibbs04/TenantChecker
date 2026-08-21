import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only code paths (webhooks) that must
// call RPCs whose execute grant is restricted to service_role, e.g.
// mark_paid(). Never import this from client components or anything
// that ships to the browser.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// profiles has no email column (email lives on auth.users, which normal
// clients can't read) — notification trigger points that need to email
// "the other party" (e.g. a tenant's consent notifying their landlord)
// go through the admin API instead.
export async function getUserEmailById(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}
