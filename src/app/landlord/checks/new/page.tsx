import { createClient } from "@/lib/supabase/server";
import { BuyTenantcheckForm } from "./buy-tenantcheck-form";

export default async function BuyTenantcheckPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const { property } = await searchParams;
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, label, address_line1")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold">Buy a Tenantcheck</h1>
      <p className="mt-2 text-sm text-neutral-600">
        R350.00 per tenant — charged even if you&apos;ve checked this
        property before, since each check is run against a specific
        prospective tenant.
      </p>
      <BuyTenantcheckForm
        properties={properties ?? []}
        preselectedPropertyId={property}
      />
    </div>
  );
}
