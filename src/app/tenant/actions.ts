"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CONSENT_TEXT, CONSENT_VERSION } from "@/lib/consent";
import {
  APPLICATION_FORM_FIELDS,
  REQUIRED_DOCUMENT_TYPES,
  type ApplicationFormData,
  type RequiredDocumentType,
} from "@/lib/application-form";
import { sendEmail } from "@/lib/resend";
import { paymentRequestedEmail } from "@/lib/email-templates";
import { getUserEmailById } from "@/lib/supabase/service";

export async function submitConsent(formData: FormData) {
  const checkId = String(formData.get("check_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_consent", {
    p_check_id: checkId,
    p_consent_version: CONSENT_VERSION,
    p_consent_text: CONSENT_TEXT,
  });

  if (error) throw new Error(error.message);

  await notifyLandlordPaymentRequested(supabase, checkId);

  redirect(`/tenant/checks/${checkId}`);
}

// Notification failures must never block consent itself — the check has
// already moved to AWAITING_PAYMENT regardless of whether this email
// goes out; the landlord's dashboard still shows it either way.
async function notifyLandlordPaymentRequested(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checkId: string
) {
  try {
    const { data: check } = await supabase
      .from("checks")
      .select("landlord_id, tenant_full_name, properties(label)")
      .eq("id", checkId)
      .single();
    if (!check) return;

    const landlordEmail = await getUserEmailById(check.landlord_id);
    if (!landlordEmail) return;

    const propertyLabel =
      (check.properties as unknown as { label: string } | null)?.label ?? "your property";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const { subject, html } = paymentRequestedEmail({
      tenantName: check.tenant_full_name,
      propertyLabel,
      payUrl: `${appUrl}/landlord/checks/${checkId}/pay`,
    });
    const result = await sendEmail({ to: landlordEmail, subject, html });

    await supabase.rpc("log_notification", {
      p_check_id: checkId,
      p_recipient_id: check.landlord_id,
      p_channel: "email",
      p_template: "payment_requested",
      p_status: result.ok ? "sent" : "failed",
    });
  } catch (err) {
    console.error("notifyLandlordPaymentRequested failed", err);
  }
}

function extractFormData(formData: FormData): ApplicationFormData {
  const data = {} as ApplicationFormData;
  for (const field of APPLICATION_FORM_FIELDS) {
    data[field.name] = String(formData.get(field.name) ?? "").trim() as never;
  }
  return data;
}

export async function saveApplicationDraft(formData: FormData) {
  const checkId = String(formData.get("check_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("application_forms")
    .update({ form_data: extractFormData(formData) })
    .eq("check_id", checkId);

  if (error) throw new Error(error.message);

  revalidatePath(`/tenant/checks/${checkId}/application`);
}

export async function submitApplication(formData: FormData) {
  const checkId = String(formData.get("check_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_application", {
    p_check_id: checkId,
    p_form_data: extractFormData(formData),
  });

  if (error) throw new Error(error.message);

  redirect(`/tenant/checks/${checkId}`);
}

export async function uploadDocument(formData: FormData) {
  const checkId = String(formData.get("check_id") ?? "");
  const documentType = String(formData.get("document_type") ?? "") as RequiredDocumentType;
  const file = formData.get("file") as File | null;

  if (!REQUIRED_DOCUMENT_TYPES.includes(documentType)) {
    throw new Error("Invalid document type");
  }
  if (!file || file.size === 0) {
    throw new Error("No file provided");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File is too large (max 10MB)");
  }
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PDF, JPG, or PNG files are allowed");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const extension = file.name.split(".").pop() || "bin";
  const storagePath = `${checkId}/${documentType}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("tenant-documents")
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("documents").insert({
    check_id: checkId,
    document_type: documentType,
    uploaded_by: user.id,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/tenant/checks/${checkId}/application`);
}
