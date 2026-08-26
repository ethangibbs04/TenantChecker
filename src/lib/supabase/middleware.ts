import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if expired — required for Server Components,
  // which can't set cookies themselves.
  await supabase.auth.getUser();

  // Remembers which dashboard the visitor last had open, so navigating to a
  // neutral page (Home, Product, About, Contact) doesn't read as "logged
  // out of" that dashboard — the header keeps showing its nav/badge until
  // they explicitly open a different role's dashboard. Server Components
  // can only read cookies, not set them, so this has to happen here rather
  // than in the layouts themselves; `getCurrentUserAndRoles` reads it back
  // and validates it against the user's actual roles before trusting it.
  const roleRouteMatch = request.nextUrl.pathname.match(/^\/(landlord|tenant|admin)(\/|$)/);
  if (roleRouteMatch) {
    supabaseResponse.cookies.set("active_role", roleRouteMatch[1], {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}
