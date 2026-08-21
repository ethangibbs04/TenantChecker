import { NextResponse } from "next/server";
import { verifyItnSignature } from "@/lib/payfast";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/resend";
import { applicationRequestedEmail } from "@/lib/email-templates";

// PayFast's server-to-server Instant Transaction Notification. Must
// respond quickly; PayFast retries on non-2xx. Signature verification is
// mandatory. Source-IP allowlisting and PayFast's own "query/validate"
// server round-trip are documented best practices we're deliberately
// skipping for now (tracked in PLAN.md Phase 8) — this endpoint is
// unreachable from PayFast's real servers until a public URL is
// configured anyway, and IP allowlisting would break local tunnel
// testing.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const { valid, fields } = verifyItnSignature(rawBody);

  if (!valid) {
    console.error("PayFast ITN: invalid signature", fields);
    return new NextResponse("invalid signature", { status: 400 });
  }

  if (fields.payment_status !== "COMPLETE") {
    // Not an error — PayFast also notifies on other statuses. Just don't
    // mark the check paid.
    return new NextResponse("ok", { status: 200 });
  }

  const checkId = fields.m_payment_id;
  const amount = Number(fields.amount_gross ?? fields.amount);

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("mark_paid", {
    p_check_id: checkId,
    p_provider_payment_id: fields.pf_payment_id,
    p_amount: amount,
    p_raw_payload: fields,
  });

  if (error) {
    console.error("PayFast ITN: mark_paid failed", error.message, fields);
    return new NextResponse("mark_paid failed", { status: 500 });
  }

  // Notification failure must not turn this into a 500 — mark_paid()
  // already succeeded, which is what PayFast's retry logic cares about.
  try {
    const { data: check } = await supabase
      .from("checks")
      .select("tenant_id, tenant_email, tenant_full_name, properties(label)")
      .eq("id", checkId)
      .single();

    if (check) {
      const propertyLabel =
        (check.properties as unknown as { label: string } | null)?.label ?? "your property";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
      const { subject, html } = applicationRequestedEmail({
        propertyLabel,
        applicationUrl: `${appUrl}/tenant/checks/${checkId}/application`,
      });
      const result = await sendEmail({ to: check.tenant_email, subject, html });

      await supabase.rpc("log_notification", {
        p_check_id: checkId,
        p_recipient_id: check.tenant_id,
        p_channel: "email",
        p_template: "application_requested",
        p_status: result.ok ? "sent" : "failed",
      });
    }
  } catch (notifyErr) {
    console.error("PayFast ITN: application_requested notification failed", notifyErr);
  }

  return new NextResponse("ok", { status: 200 });
}
