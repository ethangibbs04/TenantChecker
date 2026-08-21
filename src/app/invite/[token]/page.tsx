import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: previewRows } = await supabase.rpc("get_check_by_invite_token", {
    p_token: token,
  });
  const preview = previewRows?.[0];

  if (!preview) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Invite not found</h1>
        <p className="mt-2 text-neutral-600">
          This link is invalid, has already been used, or has expired. Ask
          your landlord to send you a new one.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function acceptAndContinue() {
    "use server";
    const supabase = await createClient();
    const { data: checkId, error } = await supabase.rpc("accept_invite", {
      p_token: token,
    });
    if (error) throw new Error(error.message);
    redirect(`/tenant/checks/${checkId}/consent`);
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">You&apos;ve been invited</h1>
      <p className="mt-2 text-neutral-600">
        {preview.property_label} has requested a Tenantcheck vetting for{" "}
        <span className="font-medium">{preview.tenant_full_name}</span>.
      </p>

      {user ? (
        <form action={acceptAndContinue} className="mt-6">
          <p className="mb-3 text-sm text-neutral-500">
            Continue as {user.email}?
          </p>
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Continue
          </button>
        </form>
      ) : (
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href={`/signup?invite=${token}`}
            className="rounded bg-black px-4 py-2 text-white"
          >
            Sign up
          </Link>
          <Link href={`/login?invite=${token}`} className="rounded border px-4 py-2">
            Log in
          </Link>
        </div>
      )}
    </main>
  );
}
