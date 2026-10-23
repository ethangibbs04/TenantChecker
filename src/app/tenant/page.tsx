import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ListTodo, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  FAILED_STATUSES,
  STATUS_LABEL,
  TENANT_ACTIONABLE_STATUSES,
  getActivitySection,
  type CheckStatus,
} from "@/lib/checks";

type CheckRow = {
  id: string;
  status: CheckStatus;
  created_at: string;
  properties: { label: string } | null;
};

function CheckCard({ check, index = 0 }: { check: CheckRow; index?: number }) {
  const waitingOnTenant = TENANT_ACTIONABLE_STATUSES.includes(check.status);
  return (
    <Card
      className="stagger-item py-0 transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md"
      style={{ "--stagger-index": index } as CSSProperties}
    >
      <CardContent className="p-0">
        <Link href={`/tenant/checks/${check.id}`} className="flex flex-col gap-1.5 p-4">
          <span className="font-medium text-slate-900">{check.properties?.label}</span>
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            {check.status === "COMPLETED" && (
              <CheckCircle2 className="size-4 shrink-0 text-success-600" aria-hidden="true" />
            )}
            {FAILED_STATUSES.includes(check.status) && (
              <XCircle className="size-4 shrink-0 text-danger-600" aria-hidden="true" />
            )}
            {STATUS_LABEL[check.status]}
            {waitingOnTenant && (
              <span
                className="inline-block size-1.5 shrink-0 rounded-full bg-danger-600"
                aria-hidden="true"
              />
            )}
            {waitingOnTenant && <span className="sr-only"> — action needed</span>}
          </span>
        </Link>
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
