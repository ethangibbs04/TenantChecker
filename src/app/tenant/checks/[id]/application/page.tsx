import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import type { ApplicationFormData } from "@/lib/application-form";
import { isDocumentSetComplete, REQUIRED_DOCUMENT_TYPES, type RequiredDocumentType } from "@/lib/application-form";
import { ApplicationForm } from "./application-form";
import { DocumentUploader } from "./document-uploader";

async function signViewAndDownload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string
) {
  const [view, download] = await Promise.all([
    supabase.storage.from("tenant-documents").createSignedUrl(storagePath, 300),
    supabase.storage.from("tenant-documents").createSignedUrl(storagePath, 300, { download: true }),
  ]);
  return {
    viewUrl: view.data?.signedUrl ?? null,
    downloadUrl: download.data?.signedUrl ?? null,
  };
}

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Explicit tenant_id filter — RLS also allows this row through for the
  // landlord of the check, and this is the tenant-facing application form.
  const { data: check } = await supabase
    .from("checks")
    .select("id, status, properties(label)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!check) notFound();

  if (check.status !== "AWAITING_APPLICATION") {
    redirect(`/tenant/checks/${id}`);
  }

  const { data: applicationForm } = await supabase
    .from("application_forms")
    .select("form_data")
    .eq("check_id", id)
    .single();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, document_type, file_name, created_at, storage_path")
    .eq("check_id", id)
    .in("document_type", REQUIRED_DOCUMENT_TYPES)
    .order("created_at", { ascending: true });

  const filesByType: Partial<
    Record<RequiredDocumentType, { id: string; document_type: string; file_name: string; created_at: string; viewUrl: string | null; downloadUrl: string | null }[]>
  > = {};
  const uploadedTypes = new Set<string>();

  for (const doc of documents ?? []) {
    const type = doc.document_type as RequiredDocumentType;
    uploadedTypes.add(type);
    const urls = await signViewAndDownload(supabase, doc.storage_path);
    (filesByType[type] ??= []).push({ ...doc, ...urls });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeader
        title="Tenantcheck application"
        description={`${(check.properties as unknown as { label: string } | null)?.label} · fill in your details and upload the documents below, then submit. You can save your progress and come back later.`}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        <DocumentUploader checkId={id} filesByType={filesByType} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Application details</h2>
        <ApplicationForm
          checkId={id}
          initialData={(applicationForm?.form_data as ApplicationFormData) ?? null}
          allDocumentsUploaded={isDocumentSetComplete(uploadedTypes)}
        />
      </div>
    </div>
  );
}
