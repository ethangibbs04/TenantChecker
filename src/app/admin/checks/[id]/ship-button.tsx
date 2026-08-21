"use client";

import { useState, useTransition } from "react";
import { shipCheck } from "@/app/admin/actions";

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

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await shipCheck(checkId);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to ship");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!readyToShip}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        Ship check
      </button>
      {!readyToShip && (
        <p className="mt-2 text-xs text-amber-600">
          Upload the credit check and AI recommendation above before shipping.
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded bg-white p-6">
            <h2 className="text-lg font-semibold">Ship this Tenantcheck?</h2>
            <p className="mt-2 text-sm text-neutral-600">
              This releases the credit check and AI recommendation to the
              landlord and can&apos;t be undone. Make sure both documents are
              correct before continuing.
            </p>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded border px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {isPending ? "Shipping…" : "Confirm ship"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
