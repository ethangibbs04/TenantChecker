import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, label, address_line1, city")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your Properties</h1>
        <Link
          href="/landlord/checks/new"
          className="rounded bg-black px-3 py-2 text-sm text-white"
        >
          Buy Tenantcheck
        </Link>
      </div>

      {!properties || properties.length === 0 ? (
        <p className="text-neutral-600">
          No properties yet — a property is added automatically the first
          time you{" "}
          <Link href="/landlord/checks/new" className="underline">
            buy a Tenantcheck
          </Link>{" "}
          against it.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/landlord/properties/${p.id}`}
                className="block rounded border p-4 hover:bg-neutral-50"
              >
                <p className="font-medium">{p.label}</p>
                <p className="text-sm text-neutral-500">
                  {p.address_line1}
                  {p.city ? `, ${p.city}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
