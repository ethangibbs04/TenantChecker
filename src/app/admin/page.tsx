import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("checks")
    .select("id, tenant_full_name, status, created_at, properties(label)");

  // PROCESSING checks need admin action, so they float to the top
  // (oldest first, so nothing sits in the queue indefinitely).
  const sorted = [...(checks ?? [])].sort((a, b) => {
    if (a.status === "PROCESSING" && b.status !== "PROCESSING") return -1;
    if (b.status === "PROCESSING" && a.status !== "PROCESSING") return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>

      {sorted.length === 0 ? (
        <p className="text-neutral-600">No Tenantchecks yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((c) => (
            <li
              key={c.id}
              className={`rounded border p-4 ${
                c.status === "PROCESSING" ? "border-black" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/admin/checks/${c.id}`} className="font-medium underline">
                    {c.tenant_full_name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {(c.properties as unknown as { label: string } | null)?.label}
                  </p>
                </div>
                {c.status === "PROCESSING" && (
                  <span className="rounded bg-black px-2 py-1 text-xs text-white">
                    Needs review
                  </span>
                )}
              </div>
              <div className="mt-3">
                <StatusTracker status={c.status as CheckStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
