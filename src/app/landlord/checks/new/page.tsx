import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        title="Buy a Tenantcheck"
        description="R350.00 per tenant — charged even if you've checked this property before, since each check is run against a specific prospective tenant."
      />
      <BuyTenantcheckForm
        properties={properties ?? []}
        preselectedPropertyId={property}
      />
    </div>
  );
}
