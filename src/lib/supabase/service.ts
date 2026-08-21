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
