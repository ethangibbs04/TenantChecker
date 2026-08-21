import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";
import { InviteLinkBox } from "./invite-link-box";
import { PackageDownloads } from "./package-downloads";

export default async function CheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: check } = await supabase
    .from("checks")
    .select(
      "id, tenant_full_name, tenant_email, tenant_phone, status, created_at, properties(label)"
    )
    .eq("id", id)
    .single();

  if (!check) notFound();

  const { data: payment } = await supabase
    .from("payments")
    .select("amount, currency, status")
    .eq("check_id", id)
    .single();

  const { data: invite } = await supabase
    .from("check_invites")
    .select("token, expires_at, used_at")
    .eq("check_id", id)
    .single();

  const { data: packageDocuments } = await supabase
    .from("documents")
    .select("id, document_type")
    .eq("check_id", id)
    .eq("is_package_document", true);

  const { data: applicationForm } = await supabase
    .from("application_forms")
    .select("id")
    .eq("check_id", id)
    .eq("status", "submitted")
    .maybeSingle();

  const showPackage =
    check.status === "COMPLETED" &&
    ((packageDocuments && packageDocuments.length > 0) || !!applicationForm);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{check.tenant_full_name}</h1>
        <p className="text-sm text-neutral-500">
          {(check.properties as unknown as { label: string } | null)?.label} ·{" "}
          {check.tenant_email}
          {check.tenant_phone ? ` · ${check.tenant_phone}` : ""}
        </p>
      </div>

      <StatusTracker status={check.status as CheckStatus} />

      <div className="rounded border p-4 text-sm">
        <p>
          <span className="font-medium">Payment:</span>{" "}
          {payment
            ? `${payment.currency} ${payment.amount} — ${payment.status}`
            : "—"}
        </p>
        {check.status === "AWAITING_PAYMENT" && (
          <Link
            href={`/landlord/checks/${id}/pay`}
            className="mt-3 inline-block rounded bg-black px-3 py-2 text-sm text-white"
          >
            Pay now
          </Link>
        )}
      </div>

      {invite && !invite.used_at && (
        <InviteLinkBox token={invite.token} expiresAt={invite.expires_at as string} />
      )}

      {showPackage && (
        <PackageDownloads
          checkId={id}
          hasApplicationForm={!!applicationForm}
          documents={packageDocuments ?? []}
        />
      )}
    </div>
  );
}
