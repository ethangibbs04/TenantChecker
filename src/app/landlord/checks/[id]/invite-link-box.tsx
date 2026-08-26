"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Tenant invite link</p>
          <p className="mt-1 text-xs text-slate-500">
            Automatic email/WhatsApp delivery isn&apos;t wired up yet — share this
            link with the tenant directly for now. Expires{" "}
            {new Date(expiresAt).toLocaleDateString()}.
          </p>
        </div>
        <div className="flex gap-2">
          <Input readOnly value={url} onFocus={(e) => e.target.select()} />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
