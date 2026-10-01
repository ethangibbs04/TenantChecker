import type { CSSProperties } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ADMIN_ACTIONABLE_STATUSES, ADMIN_IN_PROGRESS_STATUSES, HISTORY_STATUSES } from "@/lib/checks";
import type { VariantProps } from "class-variance-authority";

const ACCENT_BORDER: Record<string, string> = {
  warning: "border-l-warning-600",
  info: "border-l-info-600",
  secondary: "border-l-slate-300",
};

function SectionLink({
  href,
  title,
  description,
  count,
  badgeVariant = "secondary",
  index = 0,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  badgeVariant?: VariantProps<typeof badgeVariants>["variant"];
  index?: number;
}) {
  return (
    <Link href={href}>
      <Card
        className={`stagger-item gap-0 border-l-4 py-0 transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md ${
          ACCENT_BORDER[badgeVariant ?? "secondary"] ?? ACCENT_BORDER.secondary
        }`}
        style={{ "--stagger-index": index } as CSSProperties}
      >
        <div className="flex w-full items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              {title}
              <Badge variant={badgeVariant}>{count}</Badge>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: todoCount }, { count: inProgressCount }, { count: historyCount }] = await Promise.all([
    supabase.from("checks").select("id", { count: "exact", head: true }).in("status", ADMIN_ACTIONABLE_STATUSES),
    supabase.from("checks").select("id", { count: "exact", head: true }).in("status", ADMIN_IN_PROGRESS_STATUSES),
    supabase.from("checks").select("id", { count: "exact", head: true }).in("status", HISTORY_STATUSES),
  ]);

  const total = (todoCount ?? 0) + (inProgressCount ?? 0) + (historyCount ?? 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Admin Dashboard"
        description="Every Tenantcheck on the platform — click a section to search and browse."
      />

      {total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Tenantchecks yet"
          description="Checks will show up here as landlords start buying them."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <SectionLink
            href="/admin/todo"
            title="To-Do"
            description="Checks waiting on your review before they can ship."
            count={todoCount ?? 0}
            badgeVariant="warning"
            index={0}
          />
          <SectionLink
            href="/admin/in-progress"
            title="In Progress"
            description="Awaiting the tenant or landlord — nothing for you to do yet."
            count={inProgressCount ?? 0}
            badgeVariant="info"
            index={1}
          />
          <SectionLink
            href="/admin/history"
            title="History"
            description="Completed, declined, cancelled, or expired checks."
            count={historyCount ?? 0}
            index={2}
          />
        </div>
      )}
    </div>
  );
}
