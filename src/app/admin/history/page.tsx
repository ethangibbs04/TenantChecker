import { AdminCheckList } from "../admin-check-list";
import { HISTORY_STATUSES } from "@/lib/checks";

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  return (
    <AdminCheckList
      title="History"
      description="Completed, declined, cancelled, or expired checks."
      statuses={HISTORY_STATUSES}
      sortDesc
      q={q ?? ""}
      page={page ? parseInt(page, 10) || 1 : 1}
    />
  );
}
