"use client";

import { useId, useRef, useState, useTransition } from "react";
import { CheckCircle2, Download, Eye, FileText, Loader2, Lock, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UploadedDoc = {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png";

export function DocumentUploadRow({
  checkId,
  documentType,
  label,
  existing,
  uploadAction,
  locked = false,
}: {
  checkId: string;
  documentType: string;
  label: string;
  existing: UploadedDoc | null;
  uploadAction: (formData: FormData) => Promise<void>;
  // Once true, renders read-only — no upload, no "replace." A new upload
  // for a document_type that's already been released (e.g. shipped to the
  // landlord) has no way to reach the released copy: nothing re-flags it
  // as the package document, so it would silently upload without ever
  // becoming visible anywhere. Locking is the deliberate replacement for
  // "let it silently orphan."
  locked?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(existing?.file_name ?? null);
  const [isPending, startTransition] = useTransition();

  function upload(file: File) {
    setError(null);
    setFileName(file.name);
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
    if (isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  const isUploaded = !!fileName && !error;

  if (locked) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-success-100 text-success-600">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="flex items-center gap-1 text-xs font-medium text-slate-900">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-40 truncate">{existing?.file_name ?? "—"}</span>
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Lock className="size-3 shrink-0" aria-hidden="true" />
              Shipped — locked
            </p>
          </div>
          {(existing?.viewUrl || existing?.downloadUrl) && (
            <div className="flex items-center gap-1">
              {existing.viewUrl && (
                <Button asChild variant="ghost" size="sm">
                  <a href={existing.viewUrl} target="_blank" rel="noreferrer">
                    <Eye />
                    View
                  </a>
                </Button>
              )}
              {existing.downloadUrl && (
                <Button asChild variant="ghost" size="icon-sm">
                  <a href={existing.downloadUrl} target="_blank" rel="noreferrer">
                    <Download />
                    <span className="sr-only">Download</span>
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isPending) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "group flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed bg-slate-50/60 px-4 py-6 text-center transition-colors",
          isDragging && "border-sky-500 bg-sky-50",
          isUploaded && !isDragging && "border-success-600/40 bg-success-100/40",
          error && !isDragging && "border-destructive/40 bg-destructive/5",
          !isDragging && !isUploaded && !error && "border-slate-300 hover:border-navy-400 hover:bg-navy-50/40",
          isPending && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
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

        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            isUploaded ? "bg-success-100 text-success-600" : "bg-navy-50 text-navy-700"
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : isUploaded ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
        </div>

        {isPending ? (
          <p className="text-xs text-slate-500">Uploading…</p>
        ) : isUploaded ? (
          <div className="flex flex-col items-center gap-0.5">
            <p className="flex items-center gap-1 text-xs font-medium text-slate-900">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-40 truncate">{fileName}</span>
            </p>
            <p className="text-xs text-sky-600 group-hover:underline">Replace file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-xs text-slate-600">
              <span className="font-medium text-sky-600">Choose a file</span> or drag it here
            </p>
            <p className="text-xs text-slate-400">PDF, JPG or PNG</p>
          </div>
        )}
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
