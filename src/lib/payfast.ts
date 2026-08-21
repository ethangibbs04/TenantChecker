import crypto from "node:crypto";

// PayFast's signature algorithm, mirrored from their official PHP SDK
// (PayFast/payfast-php-sdk, lib/Auth.php::generateSignature). It has a
// quirk worth preserving exactly: every field is followed by '&' — including
// the last one — and when a passphrase is set it's appended as
// '&passphrase=...' on top of that trailing '&', producing a double '&'.
// This isn't a bug we get to "fix": PayFast's own servers compute the
// signature the same way, so byte-for-byte reproduction is what makes our
// signature (and our validation of their ITN) match theirs.

// PHP's urlencode(): spaces become '+', and unlike JS's encodeURIComponent
// it also escapes ! * ' ( ) rather than leaving them literal.
function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildParamString(orderedEntries: [string, string][], passphrase?: string): string {
  let pfParamString = "";
  for (const [key, val] of orderedEntries) {
    if (key === "signature") continue;
    pfParamString += `${key}=${phpUrlEncode(val)}&`;
  }
  if (passphrase) {
    pfParamString += `passphrase=${phpUrlEncode(passphrase)}`;
  }
  return pfParamString;
}

export function generateSignature(orderedEntries: [string, string][], passphrase?: string): string {
  return crypto.createHash("md5").update(buildParamString(orderedEntries, passphrase)).digest("hex");
}

export function buildPaymentFields(params: {
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  nameFirst: string;
  nameLast: string;
  emailAddress: string;
  mPaymentId: string;
  amount: string; // e.g. "350.00"
  itemName: string;
}): Record<string, string> {
  const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;

  const orderedEntries: [string, string][] = [
    ["merchant_id", process.env.PAYFAST_MERCHANT_ID!],
    ["merchant_key", process.env.PAYFAST_MERCHANT_KEY!],
    ["return_url", params.returnUrl],
    ["cancel_url", params.cancelUrl],
    ["notify_url", params.notifyUrl],
    ["name_first", params.nameFirst],
    ["name_last", params.nameLast],
    ["email_address", params.emailAddress],
    ["m_payment_id", params.mPaymentId],
    ["amount", params.amount],
    ["item_name", params.itemName],
  ];

  const signature = generateSignature(orderedEntries, passphrase);

  return Object.fromEntries([...orderedEntries, ["signature", signature]]);
}

// Verifies an ITN POST. `rawBody` must be the untouched request body so
// field order matches exactly what PayFast sent.
export function verifyItnSignature(rawBody: string): { valid: boolean; fields: Record<string, string> } {
  const params = new URLSearchParams(rawBody);
  const orderedEntries: [string, string][] = [];
  const fields: Record<string, string> = {};
  let receivedSignature = "";

  for (const [key, value] of params.entries()) {
    if (key === "signature") {
      receivedSignature = value;
    } else {
      orderedEntries.push([key, value]);
    }
    fields[key] = value;
  }

  const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
  const computed = generateSignature(orderedEntries, passphrase);

  return { valid: computed === receivedSignature, fields };
}
