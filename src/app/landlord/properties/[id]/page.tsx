import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusTracker } from "@/components/status-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const addressLine = [
    property.address_line1,
    property.address_line2,
    property.city,
    property.province,
    property.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={property.label}
        description={addressLine}
        actions={
          <Button asChild>
            <Link href={`/landlord/checks/new?property=${property.id}`}>
              Buy Tenantcheck for this property
            </Link>
          </Button>
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Tenant check history</h2>

        {!checks || checks.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No Tenantchecks yet"
            description="No Tenantchecks have been run against this property yet."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {checks.map((c, i) => (
              <Link key={c.id} href={`/landlord/checks/${c.id}`}>
                <Card
                  className="stagger-item transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md"
                  style={{ "--stagger-index": i } as CSSProperties}
                >
                  <CardContent className="flex flex-col gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{c.tenant_full_name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(c.created_at as string).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusTracker status={c.status as CheckStatus} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
