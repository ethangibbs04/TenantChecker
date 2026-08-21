"use client";

import { useState } from "react";

export function InviteLinkBox({
  token,
  expiresAt,
}: {
  token: string;
  expiresAt: string;
}) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${token}`
      : `/invite/${token}`;

  return (
    <div className="rounded border p-4">
      <p className="text-sm font-medium">Tenant invite link</p>
      <p className="mt-1 text-xs text-neutral-500">
        Automatic email/WhatsApp delivery isn&apos;t wired up yet — share this
        link with the tenant directly for now. Expires{" "}
        {new Date(expiresAt).toLocaleDateString()}.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded border bg-neutral-50 px-3 py-2 text-sm"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
