import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_LABEL, type CheckStatus } from "@/lib/checks";
import { AdminCheckSearch } from "./admin-check-search";
import type { VariantProps } from "class-variance-authority";

const PAGE_SIZE = 20;

const STATUS_BADGE_VARIANT: Record<CheckStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  AWAITING_CONSENT: "secondary",
  AWAITING_PAYMENT: "secondary",
  AWAITING_APPLICATION: "secondary",
  PROCESSING: "default",
  COMPLETED: "success",
  DECLINED: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
};

type AdminSearchRow = {
  id: string;
  tenant_full_name: string;
  status: CheckStatus;
  created_at: string;
  property_label: string | null;
  landlord_name: string | null;
  total_count: number;
};

export async function AdminCheckList({
  title,
  description,
  statuses,
  sortDesc = false,
  q,
  page,
}: {
  title: string;
  description: string;
  statuses: CheckStatus[];
  sortDesc?: boolean;
  q: string;
  page: number;
}) {
  const supabase = await createClient();
  const currentPage = Math.max(1, page);

  const { data, error } = await supabase.rpc("admin_search_checks", {
    p_query: q || null,
    p_statuses: statuses,
    p_limit: PAGE_SIZE,
    p_offset: (currentPage - 1) * PAGE_SIZE,
    p_sort_desc: sortDesc,
  });

  const rows = (data ?? []) as AdminSearchRow[];
  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Admin Dashboard
        </Link>
        <PageHeader title={title} description={description} />
      </div>

      <AdminCheckSearch initialQuery={q} />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Could not load checks: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={q ? "No matching checks" : "Nothing here"}
          description={
            q ? `No checks match "${q}".` : "Checks will show up here as they reach this stage."
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Landlord</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c, i) => (
                <TableRow key={c.id} className="stagger-item" style={{ "--stagger-index": i } as CSSProperties}>
                  <TableCell className="font-medium text-slate-900">
                    <Link href={`/admin/checks/${c.id}`} className="hover:underline">
                      {c.tenant_full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">{c.property_label}</TableCell>
                  <TableCell className="text-slate-600">{c.landlord_name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/checks/${c.id}`} className="text-sm text-sky-600 hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages} · {total} check{total === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                {currentPage <= 1 ? (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft />
                    Previous
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(currentPage - 1)}>
                      <ChevronLeft />
                      Previous
                    </Link>
                  </Button>
                )}
                {currentPage >= totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                    <ChevronRight />
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(currentPage + 1)}>
                      Next
                      <ChevronRight />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
