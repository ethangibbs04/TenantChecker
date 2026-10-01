"use client";

import { useState, useTransition } from "react";
import { shipCheck } from "@/app/admin/actions";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShipButton({
  checkId,
  readyToShip,
}: {
  checkId: string;
  readyToShip: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await shipCheck(checkId);
        setOpen(false);
        toast({
          title: "Check shipped",
          description: "The package has been released to the landlord.",
          variant: "success",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to ship");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={() => setOpen(true)} disabled={!readyToShip} className="w-fit">
        Ship check
      </Button>
      {!readyToShip && (
        <p className="text-xs text-warning-600">
          Upload the credit check and AI recommendation above before shipping.
        </p>
      )}

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship this Tenantcheck?</DialogTitle>
            <DialogDescription>
              This releases the credit check and AI recommendation to the landlord
              and can&apos;t be undone. Make sure both documents are correct before
              continuing.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Shipping…" : "Confirm ship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
