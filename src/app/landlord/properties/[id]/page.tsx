import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, label, address_line1, address_line2, city, province, postal_code")
    .eq("id", id)
    .single();

  if (!property) notFound();

  const { data: checks } = await supabase
    .from("checks")
    .select("id, tenant_full_name, status, created_at")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{property.label}</h1>
        <p className="text-sm text-neutral-500">
          {property.address_line1}
          {property.address_line2 ? `, ${property.address_line2}` : ""}
          {property.city ? `, ${property.city}` : ""}
          {property.province ? `, ${property.province}` : ""}
          {property.postal_code ? ` ${property.postal_code}` : ""}
        </p>
      </div>

      <Link
        href={`/landlord/checks/new?property=${property.id}`}
        className="w-fit rounded bg-black px-3 py-2 text-sm text-white"
      >
        Buy Tenantcheck for this property
      </Link>

      <div>
        <h2 className="text-lg font-medium">Tenant check history</h2>
        {!checks || checks.length === 0 ? (
          <p className="mt-2 text-neutral-600">
            No Tenantchecks run against this property yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {checks.map((c) => (
              <li key={c.id} className="rounded border p-4">
                <Link href={`/landlord/checks/${c.id}`} className="font-medium underline">
                  {c.tenant_full_name}
                </Link>
                <p className="text-xs text-neutral-500">
                  {new Date(c.created_at as string).toLocaleDateString()}
                </p>
                <div className="mt-3">
                  <StatusTracker status={c.status as CheckStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
