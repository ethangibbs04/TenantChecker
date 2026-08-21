"use client";

import { useState, useTransition } from "react";

type UploadedDoc = { id: string; document_type: string; file_name: string; created_at: string };

export function DocumentUploadRow({
  checkId,
  documentType,
  label,
  existing,
  uploadAction,
}: {
  checkId: string;
  documentType: string;
  label: string;
  existing: UploadedDoc | null;
  uploadAction: (formData: FormData) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await uploadAction(formData);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <div className="rounded border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {existing && (
          <span className="text-xs text-green-700">✓ {existing.file_name}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <input type="hidden" name="check_id" value={checkId} />
        <input type="hidden" name="document_type" value={documentType} />
        <input
          type="file"
          name="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          {isPending ? "Uploading…" : existing ? "Upload another" : "Upload"}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
