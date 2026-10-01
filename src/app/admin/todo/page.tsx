import { AdminCheckList } from "../admin-check-list";
import { ADMIN_ACTIONABLE_STATUSES } from "@/lib/checks";

export default async function AdminTodoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  return (
    <AdminCheckList
      title="To-Do"
      description="Checks waiting on your review before they can ship."
      statuses={ADMIN_ACTIONABLE_STATUSES}
      q={q ?? ""}
      page={page ? parseInt(page, 10) || 1 : 1}
    />
  );
}
