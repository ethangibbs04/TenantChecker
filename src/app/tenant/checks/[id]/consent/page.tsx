import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_TEXT } from "@/lib/consent";
import { submitConsent } from "@/app/tenant/actions";

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Explicit tenant_id filter — RLS also allows this row through for the
  // landlord of the check, and this is the tenant-facing consent flow.
  const { data: check } = await supabase
    .from("checks")
    .select("id, status, properties(label)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!check) notFound();

  if (check.status !== "AWAITING_CONSENT") {
    redirect(`/tenant`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-xl font-semibold">Consent to a Tenantcheck</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {(check.properties as unknown as { label: string } | null)?.label}{" "}
        has requested a Tenantcheck vetting for you.
      </p>

      <div className="mt-6 rounded border p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-600">
          Draft — pending legal review
        </p>
        <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700">
          {CONSENT_TEXT}
        </pre>
      </div>

      <form action={submitConsent} className="mt-6">
        <input type="hidden" name="check_id" value={check.id} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1" />
          I have read and agree to the above.
        </label>
        <button
          type="submit"
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Agree and continue
        </button>
      </form>
    </main>
  );
}
