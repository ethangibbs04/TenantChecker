import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";

export default async function LandlordDashboard() {
  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("checks")
    .select("id, tenant_full_name, status, created_at, properties(label)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your Tenantchecks</h1>
        <div className="flex gap-3">
          <Link href="/landlord/properties" className="rounded border px-3 py-2 text-sm">
            Properties
          </Link>
          <Link
            href="/landlord/checks/new"
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            Buy Tenantcheck
          </Link>
        </div>
      </div>

      {!checks || checks.length === 0 ? (
        <p className="text-neutral-600">
          No Tenantchecks yet.{" "}
          <Link href="/landlord/checks/new" className="underline">
            Buy your first one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {checks.map((c) => (
            <li key={c.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/landlord/checks/${c.id}`} className="font-medium underline">
                    {c.tenant_full_name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {(c.properties as unknown as { label: string } | null)?.label}
                  </p>
                </div>
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
