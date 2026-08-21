import { createElement, type ReactElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationFormData } from "@/lib/application-form";
import { ApplicationFormDocument } from "@/lib/application-form-pdf";

// Same shape as /api/documents/[id]/download: the application form isn't
// a stored file (it's `application_forms.form_data` jsonb), so there's no
// signed URL to mint — this route renders it to a PDF on-demand, styled
// to look like the form the tenant actually filled out (see
// application-form-pdf.tsx), and is the sole place `log_audit()` fires
// for it, for the same accountability reason as the document downloads
// (see Plan.md Phase 6). `application_forms_select_landlord_completed`
// already scopes this to the landlord of a COMPLETED check, so a
// mismatched check id or a not-yet-completed one just 404s rather than
// leaking existence.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: applicationForm } = await supabase
    .from("application_forms")
    .select("id, form_data, submitted_at")
    .eq("check_id", id)
    .eq("status", "submitted")
    .single();

  if (!applicationForm) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: check } = await supabase
    .from("checks")
    .select("tenant_full_name, properties(label)")
    .eq("id", id)
    .single();

  const propertyLabel =
    (check?.properties as unknown as { label: string } | null)?.label ?? "—";

  const pdfBuffer = await renderToBuffer(
    createElement(ApplicationFormDocument, {
      tenantName: check?.tenant_full_name ?? "—",
      propertyLabel,
      submittedAt: applicationForm.submitted_at,
      formData: applicationForm.form_data as ApplicationFormData,
    }) as unknown as ReactElement<DocumentProps>
  );

  await supabase.rpc("log_audit", {
    p_action: "application_form.downloaded",
    p_entity_type: "application_form",
    p_entity_id: applicationForm.id,
    p_metadata: { check_id: id },
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="application-${id}.pdf"`,
    },
  });
}
