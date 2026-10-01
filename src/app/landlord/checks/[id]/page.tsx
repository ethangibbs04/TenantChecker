import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { QueryToast } from "@/components/query-toast";
import { StatusTracker } from "@/components/status-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CheckStatus } from "@/lib/checks";
import { InviteLinkBox } from "./invite-link-box";
import { PackageDownloads } from "./package-downloads";

const PAYMENT_BADGE_VARIANT = {
  pending: "secondary",
  paid: "success",
  failed: "destructive",
  refunded: "info",
} as const;

export default async function CheckDetailPage({
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

  // Explicit landlord_id filter — RLS also allows this row through for the
  // tenant of the check, and this is the landlord-facing view (pay link,
  // invite token) that a "both" user's tenant side shouldn't be able to load.
  const { data: check } = await supabase
    .from("checks")
    .select(
      "id, tenant_full_name, tenant_email, tenant_phone, status, created_at, properties(label)"
    )
    .eq("id", id)
    .eq("landlord_id", user.id)
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

  const propertyLabel = (check.properties as unknown as { label: string } | null)?.label;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <QueryToast />
      <PageHeader
        title={check.tenant_full_name}
        description={`${propertyLabel} · ${check.tenant_email}${check.tenant_phone ? ` · ${check.tenant_phone}` : ""}`}
      />

      <StatusTracker status={check.status as CheckStatus} />

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">Payment</p>
            {payment && (
              <Badge variant={PAYMENT_BADGE_VARIANT[payment.status as keyof typeof PAYMENT_BADGE_VARIANT]}>
                {payment.status}
              </Badge>
            )}
          </div>
          <p className="text-lg font-medium text-slate-900">
            {payment ? `${payment.currency} ${payment.amount}` : "—"}
          </p>
          {check.status === "AWAITING_PAYMENT" && (
            <Button asChild className="mt-1 w-fit">
              <Link href={`/landlord/checks/${id}/pay`}>Pay now</Link>
            </Button>
          )}
        </CardContent>
      </Card>

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
