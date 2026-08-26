"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// PayFast's cancel_url points straight back at "My Activity" with this
// query param, rather than a standalone page — so cancelling reads as a
// popup over the dashboard you were already on (matching the auth dialog),
// not a navigation away from it. `useSearchParams` needs a Suspense
// boundary of its own, hence the wrapper below.
function PaymentCancelledDialogInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkId = searchParams.get("payment_cancelled");

  function close() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <Dialog open={!!checkId} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="sr-only">Payment cancelled</DialogTitle>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-danger-100 text-danger-600">
            <XCircle className="size-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-medium text-navy-900">
            Payment cancelled
          </h2>
          <p className="text-sm text-slate-500">
            No payment was taken. You can try again whenever you&apos;re ready.
          </p>
          {checkId && (
            <Button asChild className="mt-2 w-full" onClick={close}>
              <Link href={`/landlord/checks/${checkId}/pay`}>Try again</Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentCancelledDialog() {
  return (
    <Suspense fallback={null}>
      <PaymentCancelledDialogInner />
    </Suspense>
  );
}
