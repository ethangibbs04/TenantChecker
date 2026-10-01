import { AdminCheckList } from "../admin-check-list";
import { ADMIN_IN_PROGRESS_STATUSES } from "@/lib/checks";

export default async function AdminInProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  return (
    <AdminCheckList
      title="In Progress"
      description="Awaiting the tenant or landlord — nothing for you to do yet."
      statuses={ADMIN_IN_PROGRESS_STATUSES}
      q={q ?? ""}
      page={page ? parseInt(page, 10) || 1 : 1}
    />
  );
}
