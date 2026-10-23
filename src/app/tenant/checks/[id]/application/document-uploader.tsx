"use client";

import { uploadDocument } from "@/app/tenant/actions";
import { MultiDocumentUploadGroup } from "@/components/multi-document-upload-group";
import {
  DOCUMENT_UPLOAD_GROUPS,
  MAX_FILES_PER_DOCUMENT_TYPE,
  type RequiredDocumentType,
} from "@/lib/application-form";

type UploadedDoc = {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
};

export function DocumentUploader({
  checkId,
  filesByType,
}: {
  checkId: string;
  filesByType: Partial<Record<RequiredDocumentType, UploadedDoc[]>>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {DOCUMENT_UPLOAD_GROUPS.map((group) => (
        <MultiDocumentUploadGroup
          key={group.type}
          checkId={checkId}
          documentType={group.type}
          label={group.label}
          helpText={group.helpText}
          required={group.required}
          existingFiles={filesByType[group.type] ?? []}
          uploadAction={uploadDocument}
          maxFiles={MAX_FILES_PER_DOCUMENT_TYPE}
        />
      ))}
    </div>
  );
}
