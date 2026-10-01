import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { QueryToast } from "@/components/query-toast";
import { StatusTracker } from "@/components/status-tracker";
import { Button } from "@/components/ui/button";
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
    <div className="flex max-w-xl flex-col gap-8">
      <QueryToast />
      <PageHeader
        title={(check.properties as unknown as { label: string } | null)?.label ?? "Tenantcheck"}
      />

      <StatusTracker status={check.status as CheckStatus} />

      {check.status === "AWAITING_CONSENT" && (
        <Button asChild className="w-fit">
          <Link href={`/tenant/checks/${id}/consent`}>Give consent</Link>
        </Button>
      )}
      {check.status === "AWAITING_PAYMENT" && (
        <p className="text-sm text-slate-500">
          Waiting on your landlord to complete payment — nothing to do here yet.
        </p>
      )}
      {check.status === "AWAITING_APPLICATION" && (
        <Button asChild className="w-fit">
          <Link href={`/tenant/checks/${id}/application`}>Fill out application</Link>
        </Button>
      )}
    </div>
  );
}
