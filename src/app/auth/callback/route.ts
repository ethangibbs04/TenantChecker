import { createClient } from "@/lib/supabase/server";
import { ensureLandlordRole } from "@/lib/auth";
import { NextResponse } from "next/server";

// Handles the PKCE code-exchange redirect used for email confirmation and
// magic links once mailer_autoconfirm is switched back off for production.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Mirrors the immediate-session path in signup-form.tsx: a fresh
      // signup headed to a /landlord route (e.g. the "Buy Tenantcheck"
      // gate) needs the role granted before it lands there, or the route
      // guard bounces it to "/".
      if (next.startsWith("/landlord")) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await ensureLandlordRole(supabase, user.id);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
