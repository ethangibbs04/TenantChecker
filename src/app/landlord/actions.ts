"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Landlords never create a bare property — a property only ever comes
// into existence as part of buying a Tenantcheck. Reusing one for a
// repeat tenant is just picking it from the dropdown instead of
// re-entering its address.
export async function buyTenantcheck(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tenant_full_name = String(formData.get("tenant_full_name") ?? "").trim();
  const tenant_email = String(formData.get("tenant_email") ?? "").trim();
  const tenant_phone = String(formData.get("tenant_phone") ?? "").trim() || null;

  let property_id = String(formData.get("existing_property_id") ?? "");
  if (property_id === "__new__") property_id = "";

  if (!property_id) {
    const label = String(formData.get("label") ?? "").trim();
    const address_line1 = String(formData.get("address_line1") ?? "").trim();
    const address_line2 = String(formData.get("address_line2") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const province = String(formData.get("province") ?? "").trim() || null;
    const postal_code = String(formData.get("postal_code") ?? "").trim() || null;

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        landlord_id: user.id,
        label,
        address_line1,
        address_line2,
        city,
        province,
        postal_code,
      })
      .select("id")
      .single();

    if (propertyError) throw new Error(propertyError.message);
    property_id = property.id;
  }

  const { data: checkId, error } = await supabase.rpc("create_check", {
    p_property_id: property_id,
    p_tenant_full_name: tenant_full_name,
    p_tenant_email: tenant_email,
    p_tenant_phone: tenant_phone,
  });

  if (error) throw new Error(error.message);

  redirect(`/landlord/checks/${checkId}`);
}
