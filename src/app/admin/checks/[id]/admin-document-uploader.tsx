"use client";

import { uploadAdminDocument } from "@/app/admin/actions";
import { DocumentUploadRow } from "@/components/document-upload-row";
import {
  ADMIN_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABEL,
  type AdminDocumentType,
} from "@/lib/application-form";

type UploadedDoc = {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
};

export function AdminDocumentUploader({
  checkId,
  uploadedByType,
  locked = false,
}: {
  checkId: string;
  uploadedByType: Partial<Record<AdminDocumentType, UploadedDoc>>;
  locked?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ADMIN_DOCUMENT_TYPES.map((type) => (
        <DocumentUploadRow
          key={type}
          checkId={checkId}
          documentType={type}
          label={DOCUMENT_TYPE_LABEL[type]}
          existing={uploadedByType[type] ?? null}
          uploadAction={uploadAdminDocument}
          locked={locked}
        />
      ))}
    </div>
  );
}
