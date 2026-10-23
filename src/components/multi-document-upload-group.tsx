"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2, Download, Eye, Loader2, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UploadedDoc = {
  id: string;
  file_name: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png";

// Unlike DocumentUploadRow (one file per category, replace-on-reupload),
// this lets the tenant attach up to `maxFiles` files per category —
// each upload adds a new row and re-offers the dropzone until the cap is
// hit, rather than overwriting the previous file.
export function MultiDocumentUploadGroup({
  checkId,
  documentType,
  label,
  helpText,
  required,
  existingFiles,
  uploadAction,
  maxFiles = 5,
}: {
  checkId: string;
  documentType: string;
  label: string;
  helpText?: string;
  required: boolean;
  existingFiles: UploadedDoc[];
  uploadAction: (formData: FormData) => Promise<void>;
  maxFiles?: number;
}) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const atLimit = existingFiles.length >= maxFiles;

  function upload(file: File) {
    setError(null);
    const formData = new FormData();
    formData.append("check_id", checkId);
    formData.append("document_type", documentType);
    formData.append("file", file);
    startTransition(async () => {
      try {
        await uploadAction(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (isPending || atLimit) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium text-slate-900">
          {label}{" "}
          {required ? (
            <span className="text-danger-600">*</span>
          ) : (
            <span className="font-normal text-slate-400">(optional)</span>
          )}
        </p>
        {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      </div>

      {existingFiles.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {existingFiles.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-success-600/30 bg-success-100/30 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="size-4 shrink-0 text-success-600" aria-hidden="true" />
                <span className="max-w-56 truncate">{doc.file_name}</span>
              </span>
              <div className="flex items-center gap-1">
                {doc.viewUrl && (
                  <Button asChild variant="ghost" size="icon-sm">
                    <a href={doc.viewUrl} target="_blank" rel="noreferrer">
                      <Eye />
                      <span className="sr-only">View</span>
                    </a>
                  </Button>
                )}
                {doc.downloadUrl && (
                  <Button asChild variant="ghost" size="icon-sm">
                    <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                      <Download />
                      <span className="sr-only">Download</span>
                    </a>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {atLimit ? (
        <p className="text-xs text-slate-400">Maximum of {maxFiles} files uploaded.</p>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isPending) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "group flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-center transition-colors",
            isDragging && "border-sky-500 bg-sky-50",
            error && !isDragging && "border-destructive/40 bg-destructive/5",
            !isDragging &&
              !error &&
              "border-slate-300 bg-slate-50/60 hover:border-navy-400 hover:bg-navy-50/40",
            isPending && "pointer-events-none opacity-70"
          )}
        >
          <input
            id={inputId}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin text-slate-400" aria-hidden="true" />
              <span className="text-xs text-slate-500">Uploading…</span>
            </>
          ) : (
            <>
              {existingFiles.length === 0 ? (
                <Upload className="size-4 text-navy-700" aria-hidden="true" />
              ) : (
                <Plus className="size-4 text-navy-700" aria-hidden="true" />
              )}
              <span className="text-xs text-slate-600">
                <span className="font-medium text-sky-600">
                  {existingFiles.length === 0 ? "Choose a file" : "Add another"}
                </span>{" "}
                or drag it here
                {existingFiles.length > 0 && ` (${existingFiles.length}/${maxFiles})`}
              </span>
            </>
          )}
        </label>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
