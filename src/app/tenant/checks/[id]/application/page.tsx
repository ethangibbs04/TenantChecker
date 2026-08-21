import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationFormData } from "@/lib/application-form";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/application-form";
import { ApplicationForm } from "./application-form";
import { DocumentUploader } from "./document-uploader";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: check } = await supabase
    .from("checks")
    .select("id, status, properties(label)")
    .eq("id", id)
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
    .select("id, document_type, file_name, created_at")
    .eq("check_id", id)
    .in("document_type", REQUIRED_DOCUMENT_TYPES);

  const uploadedByType = new Map(
    (documents ?? []).map((d) => [d.document_type, d])
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-xl font-semibold">
        Tenantcheck application —{" "}
        {(check.properties as unknown as { label: string } | null)?.label}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Fill in your details and upload the documents below, then submit.
        You can save your progress and come back later.
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Documents</h2>
        <DocumentUploader checkId={id} uploadedByType={Object.fromEntries(uploadedByType)} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Application details</h2>
        <ApplicationForm
          checkId={id}
          initialData={(applicationForm?.form_data as ApplicationFormData) ?? null}
          allDocumentsUploaded={REQUIRED_DOCUMENT_TYPES.every((t) => uploadedByType.has(t))}
        />
      </div>
    </main>
  );
}
