// TEMPORARY — live preview of the rebuilt application page (documents +
// form) for manual review. Not linked from anywhere in the app; delete
// once reviewed.
import { ApplicationForm } from "@/app/tenant/checks/[id]/application/application-form";
import { DocumentUploader } from "@/app/tenant/checks/[id]/application/document-uploader";
import { PageHeader } from "@/components/page-header";

export default function DevApplicationFormPreview() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <PageHeader
        title="Tenantcheck application"
        description="12 Oak Street Apartment · fill in your details and upload the documents below, then submit. You can save your progress and come back later."
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        <DocumentUploader
          checkId="preview"
          filesByType={{
            id_copy: [
              {
                id: "1",
                document_type: "id_copy",
                file_name: "id-front.pdf",
                created_at: "",
                viewUrl: null,
                downloadUrl: null,
              },
            ],
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Application details</h2>
        <ApplicationForm checkId="preview" initialData={null} allDocumentsUploaded={true} />
      </div>
    </div>
  );
}
