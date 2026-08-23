import Link from "next/link";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { BuyTenantcheckButton } from "@/components/buy-tenantcheck-button";
import type { CheckStatus } from "@/lib/checks";

const HISTORY_STATUSES: CheckStatus[] = ["COMPLETED", "DECLINED", "CANCELLED", "EXPIRED"];

type CheckRow = {
  id: string;
  tenant_full_name: string;
  status: CheckStatus;
  created_at: string;
  properties: { label: string } | null;
};

function CheckCard({ check }: { check: CheckRow }) {
  return (
    <Link href={`/landlord/checks/${check.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="font-medium text-slate-900">{check.tenant_full_name}</p>
            <p className="text-xs text-slate-500">{check.properties?.label}</p>
          </div>
          <StatusTracker status={check.status} />
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function LandlordActivityPage() {
  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("checks")
    .select("id, tenant_full_name, status, created_at, properties(label)")
    .order("created_at", { ascending: false });

  const allChecks = (checks ?? []) as unknown as CheckRow[];
  const inProgress = allChecks.filter((c) => !HISTORY_STATUSES.includes(c.status));
  const history = allChecks.filter((c) => HISTORY_STATUSES.includes(c.status));

  return (
    <div className="flex flex-col gap-8">
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
          {inProgress.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                In Progress <span className="text-slate-400">({inProgress.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {inProgress.map((check) => (
                  <CheckCard key={check.id} check={check} />
                ))}
              </div>
            </section>
          )}

          {history.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                History <span className="text-slate-400">({history.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {history.map((check) => (
                  <CheckCard key={check.id} check={check} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
