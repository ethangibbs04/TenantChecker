import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthHeader } from "@/components/auth-header";
import { ResetPasswordForm } from "@/components/reset-password-form";

// Reached via the emailed reset link → /auth/callback (exchanges the code
// for a recovery session) → here. A visitor landing here any other way has
// no session, so show "expired" instead of a form that will just fail.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <AuthHeader />
      <main className="mx-auto max-w-sm px-4 py-16">
        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-medium text-navy-900">
              This link has expired
            </h2>
            <p className="text-sm text-slate-500">
              Password reset links are only valid for a short time. Request a new one to
              continue.
            </p>
            <Link
              href="/forgot-password"
              className="mt-2 text-sm font-medium text-sky-600 hover:underline"
            >
              Request a new link
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
