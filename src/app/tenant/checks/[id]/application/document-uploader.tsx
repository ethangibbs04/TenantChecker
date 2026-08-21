"use client";

import { uploadDocument } from "@/app/tenant/actions";
import { DocumentUploadRow } from "@/components/document-upload-row";
import {
  DOCUMENT_TYPE_LABEL,
  REQUIRED_DOCUMENT_TYPES,
  type RequiredDocumentType,
} from "@/lib/application-form";

type UploadedDoc = { id: string; document_type: string; file_name: string; created_at: string };

export function DocumentUploader({
  checkId,
  uploadedByType,
}: {
  checkId: string;
  uploadedByType: Partial<Record<RequiredDocumentType, UploadedDoc>>;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {REQUIRED_DOCUMENT_TYPES.map((type) => (
        <DocumentUploadRow
          key={type}
          checkId={checkId}
          documentType={type}
          label={DOCUMENT_TYPE_LABEL[type]}
          existing={uploadedByType[type] ?? null}
          uploadAction={uploadDocument}
        />
      ))}
    </div>
  );
}
