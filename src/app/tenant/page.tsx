import Link from "next/link";
import { redirect } from "next/navigation";
import { ListTodo } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TENANT_ACTIONABLE_STATUSES, getActivitySection, type CheckStatus } from "@/lib/checks";

type CheckRow = {
  id: string;
  status: CheckStatus;
  created_at: string;
  properties: { label: string } | null;
};

function CheckCard({ check }: { check: CheckRow }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <Link href={`/tenant/checks/${check.id}`} className="font-medium text-slate-900 hover:underline">
          {check.properties?.label}
        </Link>
        <StatusTracker status={check.status} />

        {check.status === "AWAITING_CONSENT" && (
          <Button asChild size="sm" className="w-fit">
            <Link href={`/tenant/checks/${check.id}/consent`}>Give consent</Link>
          </Button>
        )}
        {check.status === "AWAITING_APPLICATION" && (
          <Button asChild size="sm" className="w-fit">
            <Link href={`/tenant/checks/${check.id}/application`}>Fill out application</Link>
          </Button>
        )}
        {check.status === "AWAITING_PAYMENT" && (
          <p className="text-xs text-slate-500">
            Waiting on your landlord to complete payment — nothing to do here yet.
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
        {checks.map((check) => (
          <CheckCard key={check.id} check={check} />
        ))}
      </div>
    </section>
  );
}

export default async function TenantDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Explicit filter, not just reliance on RLS: `checks_select_participant_or_admin`
  // also lets a "both" user (landlord and tenant on different checks) read
  // rows where they're the landlord. Without this, their landlord checks
  // would leak into their own tenant to-do list.
  const { data: checks } = await supabase
    .from("checks")
    .select("id, status, created_at, properties(label)")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  const allChecks = (checks ?? []) as unknown as CheckRow[];
  const toDo = allChecks.filter(
    (c) => getActivitySection(c.status, TENANT_ACTIONABLE_STATUSES) === "todo"
  );
  const active = allChecks.filter(
    (c) => getActivitySection(c.status, TENANT_ACTIONABLE_STATUSES) === "active"
  );
  const history = allChecks.filter(
    (c) => getActivitySection(c.status, TENANT_ACTIONABLE_STATUSES) === "history"
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My Activity"
        description="Every Tenantcheck a landlord has run on you, from consent to a completed package."
      />

      {allChecks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No Tenantchecks yet"
          description="When a landlord starts a Tenantcheck for you, it'll show up here with what's needed from you next."
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
