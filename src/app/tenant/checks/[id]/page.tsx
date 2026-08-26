import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";

export default async function TenantCheckStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Explicit tenant_id filter — RLS also allows this row through for the
  // landlord of the check, and this is the tenant-facing status view.
  const { data: check } = await supabase
    .from("checks")
    .select("id, status, properties(label)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!check) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-xl font-semibold">
        {(check.properties as unknown as { label: string } | null)?.label}
      </h1>
      <div className="mt-6">
        <StatusTracker status={check.status as CheckStatus} />
      </div>

      {check.status === "AWAITING_CONSENT" && (
        <Link
          href={`/tenant/checks/${id}/consent`}
          className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
        >
          Give consent
        </Link>
      )}
      {check.status === "AWAITING_PAYMENT" && (
        <p className="mt-6 text-sm text-neutral-500">
          Waiting on your landlord to complete payment — nothing to do here
          yet.
        </p>
      )}
      {check.status === "AWAITING_APPLICATION" && (
        <Link
          href={`/tenant/checks/${id}/application`}
          className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
        >
          Fill out application
        </Link>
      )}
    </main>
  );
}
