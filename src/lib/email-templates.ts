// First-draft transactional copy — plain and functional. Revisit
// wording/branding before real tenants and landlords see these (same
// "flagged for revision" treatment as consent.ts and application-form.ts).

function wrapper(bodyHtml: string): string {
  return `<div style="font-family: Arial, Helvetica, sans-serif; color: #171717; max-width: 480px;">
    <p style="font-weight: bold; font-size: 16px; margin-bottom: 16px;">Tenantcheck</p>
    ${bodyHtml}
  </div>`;
}

export function consentRequestedEmail({
  tenantName,
  propertyLabel,
  inviteUrl,
}: {
  tenantName: string;
  propertyLabel: string;
  inviteUrl: string;
}) {
  return {
    subject: `You've been invited to a Tenantcheck for ${propertyLabel}`,
    html: wrapper(`
      <p>Hi ${tenantName},</p>
      <p>Your landlord has started a Tenantcheck for <strong>${propertyLabel}</strong>. The first step is to give consent for us to run your vetting checks.</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    `),
  };
}

export function paymentRequestedEmail({
  tenantName,
  propertyLabel,
  payUrl,
}: {
  tenantName: string;
  propertyLabel: string;
  payUrl: string;
}) {
  return {
    subject: `${tenantName} has consented — payment required to continue`,
    html: wrapper(`
      <p>${tenantName} has given consent for their Tenantcheck on <strong>${propertyLabel}</strong>.</p>
      <p>Complete payment to move on to gathering their documents:</p>
      <p><a href="${payUrl}">${payUrl}</a></p>
    `),
  };
}

export function applicationRequestedEmail({
  propertyLabel,
  applicationUrl,
}: {
  propertyLabel: string;
  applicationUrl: string;
}) {
  return {
    subject: `Payment received — complete your Tenantcheck application`,
    html: wrapper(`
      <p>Payment has been received for your Tenantcheck on <strong>${propertyLabel}</strong>.</p>
      <p>Next, fill out your application and upload your documents:</p>
      <p><a href="${applicationUrl}">${applicationUrl}</a></p>
    `),
  };
}

export function checkCompletedEmail({
  tenantName,
  propertyLabel,
  checkUrl,
}: {
  tenantName: string;
  propertyLabel: string;
  checkUrl: string;
}) {
  return {
    subject: `${tenantName}'s Tenantcheck is ready`,
    html: wrapper(`
      <p>The Tenantcheck for ${tenantName} on <strong>${propertyLabel}</strong> is complete.</p>
      <p>View and download the package:</p>
      <p><a href="${checkUrl}">${checkUrl}</a></p>
    `),
  };
}

export function expiryReminderTenantEmail({
  tenantName,
  propertyLabel,
  inviteUrl,
}: {
  tenantName: string;
  propertyLabel: string;
  inviteUrl: string;
}) {
  return {
    subject: `Reminder: your Tenantcheck invite for ${propertyLabel} expires soon`,
    html: wrapper(`
      <p>Hi ${tenantName},</p>
      <p>Your invite to consent to a Tenantcheck for <strong>${propertyLabel}</strong> expires within the next two days.</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    `),
  };
}

export function expiryReminderLandlordEmail({
  propertyLabel,
  payUrl,
}: {
  propertyLabel: string;
  payUrl: string;
}) {
  return {
    subject: `Reminder: payment for your Tenantcheck on ${propertyLabel} expires soon`,
    html: wrapper(`
      <p>The Tenantcheck for <strong>${propertyLabel}</strong> is waiting on payment, and the tenant's invite window closes within the next two days.</p>
      <p><a href="${payUrl}">${payUrl}</a></p>
    `),
  };
}
