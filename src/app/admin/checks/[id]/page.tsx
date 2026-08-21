import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusTracker } from "@/components/status-tracker";
import type { CheckStatus } from "@/lib/checks";
import {
  ADMIN_DOCUMENT_TYPES,
  APPLICATION_FORM_FIELDS,
  REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABEL,
  type AdminDocumentType,
  type ApplicationFormData,
} from "@/lib/application-form";
import { AdminDocumentUploader } from "./admin-document-uploader";
import { ShipButton } from "./ship-button";

export default async function AdminCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: check } = await supabase
    .from("checks")
    .select(
      "id, tenant_full_name, tenant_email, tenant_phone, status, created_at, properties(label)"
    )
    .eq("id", id)
    .single();

  if (!check) notFound();

  const { data: applicationForm } = await supabase
    .from("application_forms")
    .select("form_data, status, submitted_at")
    .eq("check_id", id)
    .maybeSingle();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, document_type, file_name, storage_path, created_at")
    .eq("check_id", id);

  const tenantDocuments = (documents ?? []).filter((d) =>
    (REQUIRED_DOCUMENT_TYPES as readonly string[]).includes(d.document_type)
  );
  const adminDocumentsByType = new Map(
    (documents ?? [])
      .filter((d) => (ADMIN_DOCUMENT_TYPES as readonly string[]).includes(d.document_type))
      .map((d) => [d.document_type as AdminDocumentType, d])
  );

  const tenantDocumentsWithUrls = await Promise.all(
    tenantDocuments.map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("tenant-documents")
        .createSignedUrl(doc.storage_path, 300);
      return { ...doc, signedUrl: signed?.signedUrl ?? null };
    })
  );

  const readyToShip = ADMIN_DOCUMENT_TYPES.every((t) => adminDocumentsByType.has(t));
  const formData = applicationForm?.form_data as ApplicationFormData | undefined;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{check.tenant_full_name}</h1>
        <p className="text-sm text-neutral-500">
          {(check.properties as unknown as { label: string } | null)?.label} ·{" "}
          {check.tenant_email}
          {check.tenant_phone ? ` · ${check.tenant_phone}` : ""}
        </p>
      </div>

      <StatusTracker status={check.status as CheckStatus} />

      <div>
        <h2 className="text-lg font-medium">Application form</h2>
        {!applicationForm || applicationForm.status !== "submitted" ? (
          <p className="mt-2 text-sm text-neutral-500">
            Not submitted yet.
          </p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded border p-4 text-sm">
            {APPLICATION_FORM_FIELDS.map((field) => (
              <div key={field.name} className="contents">
                <dt className="text-neutral-500">{field.label}</dt>
                <dd>{formData?.[field.name] || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium">Tenant-submitted documents</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Download these for your manual TPN credit check and AI
          recommendation workflow. Links expire in 5 minutes.
        </p>
        {tenantDocumentsWithUrls.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">None uploaded yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {tenantDocumentsWithUrls.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <span>
                  {DOCUMENT_TYPE_LABEL[doc.document_type]} — {doc.file_name}
                </span>
                {doc.signedUrl ? (
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border px-3 py-1 underline"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-neutral-400">Unavailable</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium">Credit check &amp; recommendation</h2>
        <AdminDocumentUploader
          checkId={id}
          uploadedByType={Object.fromEntries(adminDocumentsByType)}
        />
      </div>

      {check.status === "PROCESSING" && (
        <div>
          <ShipButton checkId={id} readyToShip={readyToShip} />
        </div>
      )}
    </div>
  );
}
