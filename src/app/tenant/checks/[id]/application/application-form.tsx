"use client";

import { useRef, useState, useTransition } from "react";
import { saveApplicationDraft, submitApplication } from "@/app/tenant/actions";
import { APPLICATION_FORM_FIELDS, type ApplicationFormData } from "@/lib/application-form";

export function ApplicationForm({
  checkId,
  initialData,
  allDocumentsUploaded,
}: {
  checkId: string;
  initialData: ApplicationFormData | null;
  allDocumentsUploaded: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  function handleSaveDraft() {
    if (!formRef.current) return;
    setError(null);
    const formData = new FormData(formRef.current);
    startSaving(async () => {
      try {
        await saveApplicationDraft(formData);
        setSavedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleSubmit() {
    if (!formRef.current) return;
    setError(null);
    const formData = new FormData(formRef.current);
    startSubmitting(async () => {
      try {
        await submitApplication(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit");
      }
    });
  }

  return (
    <form ref={formRef} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="check_id" value={checkId} />

      {APPLICATION_FORM_FIELDS.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-sm">
          {field.label}
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              defaultValue={initialData?.[field.name] ?? ""}
              className="rounded border px-3 py-2"
              rows={2}
            />
          ) : field.type === "select" ? (
            <select
              name={field.name}
              defaultValue={initialData?.[field.name] ?? ""}
              className="rounded border px-3 py-2"
            >
              <option value="" disabled>
                Select…
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              defaultValue={initialData?.[field.name] ?? ""}
              className="rounded border px-3 py-2"
            />
          )}
        </label>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedAt && !error && (
        <p className="text-sm text-neutral-500">Draft saved at {savedAt.toLocaleTimeString()}</p>
      )}

      {!allDocumentsUploaded && (
        <p className="text-sm text-amber-600">
          Upload all three documents above before you can submit.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !allDocumentsUploaded}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
