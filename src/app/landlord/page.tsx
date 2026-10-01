import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BuyTenantcheckButton } from "@/components/buy-tenantcheck-button";
import { LANDLORD_ACTIONABLE_STATUSES, getActivitySection, type CheckStatus } from "@/lib/checks";
import { PaymentCancelledDialog } from "./payment-cancelled-dialog";

type CheckRow = {
  id: string;
  tenant_full_name: string;
  status: CheckStatus;
  created_at: string;
  properties: { label: string } | null;
};

function CheckCard({ check, index = 0 }: { check: CheckRow; index?: number }) {
  return (
    <Card
      className="stagger-item transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md"
      style={{ "--stagger-index": index } as CSSProperties}
    >
      <CardContent className="flex flex-col gap-3">
        <Link href={`/landlord/checks/${check.id}`} className="hover:underline">
          <p className="font-medium text-slate-900">{check.tenant_full_name}</p>
          <p className="text-xs text-slate-500">{check.properties?.label}</p>
        </Link>
        <StatusTracker status={check.status} />

        {check.status === "AWAITING_PAYMENT" && (
          <Button asChild size="sm" className="w-fit">
            <Link href={`/landlord/checks/${check.id}/pay`}>Pay now</Link>
          </Button>
        )}
        {check.status === "AWAITING_CONSENT" && (
          <p className="text-xs text-slate-500">Waiting on your tenant to consent.</p>
        )}
        {check.status === "AWAITING_APPLICATION" && (
          <p className="text-xs text-slate-500">
            Waiting on your tenant to complete their application and documents.
          </p>
        )}
        {check.status === "PROCESSING" && (
          <p className="text-xs text-slate-500">Being reviewed by our team.</p>
        )}
      </CardContent>
    </Card>
  );
}

function CheckSection({ title, checks }: { title: string; checks: CheckRow[] }) {
  if (checks.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">
        {title} <span className="text-slate-400">({checks.length})</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {checks.map((check, i) => (
          <CheckCard key={check.id} check={check} index={i} />
        ))}
      </div>
    </section>
  );
}

export default async function LandlordActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Explicit filter, not just reliance on RLS: `checks_select_participant_or_admin`
  // also lets a "both" user (landlord and tenant on different checks) read
  // rows where they're the tenant. Without this, their tenant checks would
  // leak into their own landlord activity list.
  const { data: checks } = await supabase
    .from("checks")
    .select("id, tenant_full_name, status, created_at, properties(label)")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  const allChecks = (checks ?? []) as unknown as CheckRow[];
  const toDo = allChecks.filter(
    (c) => getActivitySection(c.status, LANDLORD_ACTIONABLE_STATUSES) === "todo"
  );
  const active = allChecks.filter(
    (c) => getActivitySection(c.status, LANDLORD_ACTIONABLE_STATUSES) === "active"
  );
  const history = allChecks.filter(
    (c) => getActivitySection(c.status, LANDLORD_ACTIONABLE_STATUSES) === "history"
  );

  return (
    <div className="flex flex-col gap-8">
      <PaymentCancelledDialog />

      <PageHeader
        title="My Activity"
        description="Every Tenantcheck you've bought, from initiation to a completed package."
        actions={<BuyTenantcheckButton />}
      />

      {allChecks.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Tenantchecks yet"
          description="Once you buy your first Tenantcheck, it'll show up here with live status tracking."
          action={{ label: "Buy your first one", href: "/landlord/checks/new" }}
        />
      ) : (
        <>
          <CheckSection title="To-Do" checks={toDo} />
          <CheckSection title="Active" checks={active} />
          <CheckSection title="History" checks={history} />
        </>
      )}
    </div>
  );
}
