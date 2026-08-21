import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";

export default async function TenantDashboard() {
  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("checks")
    .select("id, status, created_at, properties(label)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Your To-Do List</h1>

      {!checks || checks.length === 0 ? (
        <p className="text-neutral-600">
          No Tenantchecks pending. When a landlord starts one for you,
          it&apos;ll show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {checks.map((c) => (
            <li key={c.id} className="rounded border p-4">
              <Link href={`/tenant/checks/${c.id}`} className="font-medium underline">
                {(c.properties as unknown as { label: string } | null)?.label}
              </Link>
              <div className="mt-3">
                <StatusTracker status={c.status as CheckStatus} />
              </div>
              {c.status === "AWAITING_CONSENT" && (
                <Link
                  href={`/tenant/checks/${c.id}/consent`}
                  className="mt-3 inline-block rounded bg-black px-3 py-2 text-sm text-white"
                >
                  Give consent
                </Link>
              )}
              {c.status === "AWAITING_PAYMENT" && (
                <p className="mt-3 text-sm text-neutral-500">
                  Waiting on your landlord to complete payment — nothing to
                  do here yet.
                </p>
              )}
              {c.status === "AWAITING_APPLICATION" && (
                <Link
                  href={`/tenant/checks/${c.id}/application`}
                  className="mt-3 inline-block rounded bg-black px-3 py-2 text-sm text-white"
                >
                  Fill out application
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
