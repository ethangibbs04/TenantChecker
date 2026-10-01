"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";

// A server action can redirect() on success but has no way to show a toast
// after the fact — the component that would show it doesn't exist yet on
// the new page. Same trick as PaymentCancelledDialog: the action appends
// `?toast=<key>` to its redirect target, this component fires the matching
// toast on mount, then strips the param so a refresh doesn't repeat it.
const TOAST_MESSAGES: Record<string, { title: string; description?: string }> = {
  purchased: { title: "Tenantcheck purchased", description: "The tenant has been notified to give consent." },
  consent_submitted: { title: "Consent submitted", description: "The landlord can now proceed to payment." },
  application_submitted: { title: "Application submitted", description: "An admin will review it shortly." },
};

function QueryToastInner() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.get("toast");

  useEffect(() => {
    if (!key) return;
    const message = TOAST_MESSAGES[key];
    if (message) toast({ ...message, variant: "success" });

    const params = new URLSearchParams(searchParams);
    params.delete("toast");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // Only re-run when the toast key itself changes, not on every
    // searchParams/router identity change (router.replace below would
    // otherwise immediately re-trigger this effect).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}

export function QueryToast() {
  return (
    <Suspense fallback={null}>
      <QueryToastInner />
    </Suspense>
  );
}
