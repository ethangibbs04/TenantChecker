import { NextResponse } from "next/server";
import { verifyItnSignature } from "@/lib/payfast";
import { createServiceClient } from "@/lib/supabase/service";

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

  return new NextResponse("ok", { status: 200 });
}
