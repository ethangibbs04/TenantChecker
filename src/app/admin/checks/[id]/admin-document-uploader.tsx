"use client";

import { uploadAdminDocument } from "@/app/admin/actions";
import { DocumentUploadRow } from "@/components/document-upload-row";
import {
  ADMIN_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABEL,
  type AdminDocumentType,
} from "@/lib/application-form";

type UploadedDoc = { id: string; document_type: string; file_name: string; created_at: string };

export function AdminDocumentUploader({
  checkId,
  uploadedByType,
}: {
  checkId: string;
  uploadedByType: Partial<Record<AdminDocumentType, UploadedDoc>>;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {ADMIN_DOCUMENT_TYPES.map((type) => (
        <DocumentUploadRow
          key={type}
          checkId={checkId}
          documentType={type}
          label={DOCUMENT_TYPE_LABEL[type]}
          existing={uploadedByType[type] ?? null}
          uploadAction={uploadAdminDocument}
        />
      ))}
    </div>
  );
}
