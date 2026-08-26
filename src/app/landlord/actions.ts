"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/resend";
import { consentRequestedEmail } from "@/lib/email-templates";

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
    const address_line1 = String(formData.get("address_line1") ?? "").trim();
    const address_line2 = String(formData.get("address_line2") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const province = String(formData.get("province") ?? "").trim() || null;
    const postal_code = String(formData.get("postal_code") ?? "").trim() || null;

    // No separate "label" field in the form — the property list/detail
    // views just display address_line1 as the property's name.
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert({
        landlord_id: user.id,
        label: address_line1,
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

  await notifyTenantConsentRequested(supabase, checkId, tenant_full_name, tenant_email);

  redirect(`/landlord/checks/${checkId}`);
}

// Notification failures must never block the purchase flow itself — the
// check already exists and the landlord still has the manual invite-link
// fallback (InviteLinkBox) regardless of whether this email goes out.
async function notifyTenantConsentRequested(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checkId: string,
  tenantName: string,
  tenantEmail: string
) {
  try {
    const { data: invite } = await supabase
      .from("check_invites")
      .select("token")
      .eq("check_id", checkId)
      .single();
    if (!invite) return;

    const { data: check } = await supabase
      .from("checks")
      .select("properties(label)")
      .eq("id", checkId)
      .single();
    const propertyLabel =
      (check?.properties as unknown as { label: string } | null)?.label ?? "your property";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const { subject, html } = consentRequestedEmail({
      tenantName,
      propertyLabel,
      inviteUrl: `${appUrl}/invite/${invite.token}`,
    });
    const result = await sendEmail({ to: tenantEmail, subject, html });

    await supabase.rpc("log_notification", {
      p_check_id: checkId,
      p_recipient_id: null,
      p_channel: "email",
      p_template: "consent_requested",
      p_status: result.ok ? "sent" : "failed",
    });
  } catch (err) {
    console.error("notifyTenantConsentRequested failed", err);
  }
}
