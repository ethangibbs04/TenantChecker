import { Resend } from "resend";

// RESEND_API_KEY is deliberately left blank for now (see Plan.md Phase 7)
// — sending no-ops (logged, not thrown) until a real key is added, so
// the rest of the notification flow (notifications logging, trigger
// points) ships and can be tested independently of having a live key.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS || "Tenantcheck <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send: "${subject}" to ${to}`);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] send failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
