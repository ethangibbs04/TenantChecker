import type { CSSProperties } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { BuyTenantcheckButton } from "@/components/buy-tenantcheck-button";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, label, address_line1, city")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Properties"
        description="Every property you've bought a Tenantcheck against."
        actions={<BuyTenantcheckButton />}
      />

      {!properties || properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="A property is added automatically the first time you buy a Tenantcheck against it."
          action={{ label: "Buy your first Tenantcheck", href: "/landlord/checks/new" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p, i) => (
            <Link key={p.id} href={`/landlord/properties/${p.id}`}>
              <Card
                className="stagger-item transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md"
                style={{ "--stagger-index": i } as CSSProperties}
              >
                <CardContent className="flex flex-col gap-1">
                  <p className="font-medium text-slate-900">{p.label}</p>
                  <p className="text-sm text-slate-500">
                    {p.address_line1}
                    {p.city ? `, ${p.city}` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
