import { NextResponse } from "next/server";
import { createServiceClient, getUserEmailById } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/resend";
import {
  expiryReminderTenantEmail,
  expiryReminderLandlordEmail,
} from "@/lib/email-templates";

// Meant to be hit on a schedule (see vercel.json), not by a user —
// protected by a shared secret so it can't be triggered by anyone who
// finds the URL. Handles both halves of the Plan.md Phase 7 stale-invite
// item: reminding whoever needs to act (the tenant while AWAITING_CONSENT,
// the landlord while AWAITING_PAYMENT — payment is landlord-side per the
// Phase 3 correction) a day or two before their invite expires, then
// flipping anything that blew through the deadline anyway to EXPIRED.
//
// Deliberately a Next.js route rather than pg_cron + pg_net: it keeps
// the Resend API key in one place (Vercel env, not also duplicated into
// Postgres config/vault), and it's testable locally by just calling the
// route — no public tunnel needed, unlike the PayFast ITN webhook, since
// nothing external needs to reach in.
const REMINDER_WINDOW_MS = 48 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const { data: candidateChecks } = await supabase
    .from("checks")
    .select("id, status, landlord_id, tenant_email, tenant_full_name, properties(label)")
    .in("status", ["AWAITING_CONSENT", "AWAITING_PAYMENT"]);

  let remindersSent = 0;

  if (candidateChecks && candidateChecks.length > 0) {
    const { data: invites } = await supabase
      .from("check_invites")
      .select("check_id, token, expires_at")
      .in(
        "check_id",
        candidateChecks.map((c) => c.id)
      );
    const inviteByCheckId = new Map((invites ?? []).map((i) => [i.check_id, i]));

    const now = Date.now();
    const dueForReminder = candidateChecks.filter((c) => {
      const invite = inviteByCheckId.get(c.id);
      if (!invite) return false;
      const expiresAt = new Date(invite.expires_at).getTime();
      return expiresAt > now && expiresAt - now < REMINDER_WINDOW_MS;
    });

    if (dueForReminder.length > 0) {
      const { data: alreadyReminded } = await supabase
        .from("notifications")
        .select("check_id")
        .eq("template", "expiry_reminder")
        .in(
          "check_id",
          dueForReminder.map((c) => c.id)
        );
      const remindedIds = new Set((alreadyReminded ?? []).map((r) => r.check_id));

      for (const check of dueForReminder) {
        if (remindedIds.has(check.id)) continue;

        const invite = inviteByCheckId.get(check.id)!;
        const propertyLabel =
          (check.properties as unknown as { label: string } | null)?.label ??
          "your property";

        let to: string | null;
        let emailContent: { subject: string; html: string };
        let recipientId: string | null;

        if (check.status === "AWAITING_CONSENT") {
          to = check.tenant_email;
          recipientId = null;
          emailContent = expiryReminderTenantEmail({
            tenantName: check.tenant_full_name,
            propertyLabel,
            inviteUrl: `${appUrl}/invite/${invite.token}`,
          });
        } else {
          to = await getUserEmailById(check.landlord_id);
          recipientId = check.landlord_id;
          emailContent = expiryReminderLandlordEmail({
            propertyLabel,
            payUrl: `${appUrl}/landlord/checks/${check.id}/pay`,
          });
        }

        if (!to) continue;

        const result = await sendEmail({ to, subject: emailContent.subject, html: emailContent.html });

        await supabase.rpc("log_notification", {
          p_check_id: check.id,
          p_recipient_id: recipientId,
          p_channel: "email",
          p_template: "expiry_reminder",
          p_status: result.ok ? "sent" : "failed",
        });

        if (result.ok) remindersSent++;
      }
    }
  }

  const { data: expiredIds, error: expireError } = await supabase.rpc("expire_stale_checks");

  return NextResponse.json({
    remindersSent,
    expiredCount: expiredIds?.length ?? 0,
    expireError: expireError?.message ?? null,
  });
}
