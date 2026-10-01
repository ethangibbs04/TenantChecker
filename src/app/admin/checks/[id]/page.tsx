import { Ban, Clock, Download, Eye, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusTracker } from "@/components/status-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Nothing for admin to review before the check reaches PROCESSING — show a
// plain "what's it waiting on" message instead of empty upload boxes that
// imply there's something to do.
const WAITING_STEP: Partial<Record<CheckStatus, { title: string; description: string }>> = {
  AWAITING_CONSENT: {
    title: "Awaiting tenant consent",
    description: "The tenant hasn't signed consent yet — there's nothing to review until they do.",
  },
  AWAITING_PAYMENT: {
    title: "Awaiting landlord payment",
    description: "The landlord needs to complete payment before their tenant can start the application.",
  },
  AWAITING_APPLICATION: {
    title: "Awaiting tenant application",
    description: "The tenant is completing their application and uploading documents — check back once they submit.",
  },
};

const TERMINAL_STEP: Partial<Record<CheckStatus, { title: string; description: string }>> = {
  DECLINED: {
    title: "Declined",
    description: "This check was declined. No further action is needed.",
  },
  CANCELLED: {
    title: "Cancelled",
    description: "This check was cancelled. No further action is needed.",
  },
  EXPIRED: {
    title: "Expired",
    description: "This check expired before it was completed. No further action is needed.",
  },
};

const PAYMENT_BADGE_VARIANT = {
  pending: "secondary",
  paid: "success",
  failed: "destructive",
  refunded: "info",
} as const;

// Admin only needs to see documents once there's something to review —
// PROCESSING (ready for review) or COMPLETED (already shipped, kept
// visible for reference).
const REVIEW_STAGE_STATUSES: CheckStatus[] = ["PROCESSING", "COMPLETED"];

// Every raw file lives in the private "tenant-documents" bucket, so both a
// view (renders inline) and a download (forces a save prompt) link are just
// the same signed URL minted two ways.
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

  const { data: payment } = await supabase
    .from("payments")
    .select("amount, currency, status")
    .eq("check_id", id)
    .maybeSingle();

  const tenantDocuments = (documents ?? []).filter((d) =>
    (REQUIRED_DOCUMENT_TYPES as readonly string[]).includes(d.document_type)
  );
  const adminDocuments = (documents ?? []).filter((d) =>
    (ADMIN_DOCUMENT_TYPES as readonly string[]).includes(d.document_type)
  );

  const tenantDocumentsWithUrls = await Promise.all(
    tenantDocuments.map(async (doc) => ({
      ...doc,
      ...(await signViewAndDownload(supabase, doc.storage_path)),
    }))
  );

  const adminDocumentsByType = new Map(
    await Promise.all(
      adminDocuments.map(async (doc) => [
        doc.document_type as AdminDocumentType,
        { ...doc, ...(await signViewAndDownload(supabase, doc.storage_path)) },
      ] as const)
    )
  );

  const readyToShip = ADMIN_DOCUMENT_TYPES.every((t) => adminDocumentsByType.has(t));
  const isApplicationFormSubmitted = applicationForm?.status === "submitted";
  const formData = applicationForm?.form_data as ApplicationFormData | undefined;

  const status = check.status as CheckStatus;
  const waitingStep = WAITING_STEP[status];
  const terminalStep = TERMINAL_STEP[status];
  const isReviewStage = REVIEW_STAGE_STATUSES.includes(status);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeader
        title={check.tenant_full_name}
        description={`${(check.properties as unknown as { label: string } | null)?.label} · ${check.tenant_email}${check.tenant_phone ? ` · ${check.tenant_phone}` : ""}`}
      />

      <StatusTracker status={status} />

      {waitingStep && (
        <EmptyState icon={Clock} title={waitingStep.title} description={waitingStep.description} />
      )}

      {terminalStep && (
        <EmptyState icon={Ban} title={terminalStep.title} description={terminalStep.description} />
      )}

      {isReviewStage && (
        <>
          <Card>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Landlord payment</span>
              {payment ? (
                <Badge variant={PAYMENT_BADGE_VARIANT[payment.status as keyof typeof PAYMENT_BADGE_VARIANT]}>
                  {payment.status === "paid"
                    ? `Paid — ${payment.currency} ${payment.amount}`
                    : payment.status}
                </Badge>
              ) : (
                <Badge variant="secondary">Unknown</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenant-submitted documents</CardTitle>
              <CardDescription>
                For your manual TPN credit check and AI recommendation workflow.
                Links expire in 5 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {tenantDocumentsWithUrls.length === 0 ? (
                <p className="text-sm text-slate-500">None uploaded yet.</p>
              ) : (
                tenantDocumentsWithUrls.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-slate-700">
                      <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                      {DOCUMENT_TYPE_LABEL[doc.document_type]} — {doc.file_name}
                    </span>
                    {doc.viewUrl || doc.downloadUrl ? (
                      <div className="flex items-center gap-1">
                        {doc.viewUrl && (
                          <Button asChild variant="ghost" size="sm">
                            <a href={doc.viewUrl} target="_blank" rel="noreferrer">
                              <Eye />
                              View
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
                    ) : (
                      <span className="text-xs text-slate-400">Unavailable</span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipped documents</CardTitle>
              <CardDescription>
                {status === "COMPLETED"
                  ? "This check has been shipped — these documents are locked and can no longer be replaced from here."
                  : "The application form, credit check, and AI recommendation released to the landlord once you ship this check."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isApplicationFormSubmitted && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                      Application form
                    </span>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <a href={`/api/checks/${id}/application-form/download?view=1`} target="_blank" rel="noreferrer">
                          <Eye />
                          View
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm">
                        <a href={`/api/checks/${id}/application-form/download`} target="_blank" rel="noreferrer">
                          <Download />
                          <span className="sr-only">Download</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 p-4 text-sm">
                    {APPLICATION_FORM_FIELDS.map((field) => (
                      <div key={field.name} className="contents">
                        <dt className="text-slate-500">{field.label}</dt>
                        <dd className="text-slate-900">{formData?.[field.name] || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <AdminDocumentUploader
                checkId={id}
                uploadedByType={Object.fromEntries(adminDocumentsByType)}
                locked={status === "COMPLETED"}
              />
            </CardContent>
          </Card>
        </>
      )}

      {status === "PROCESSING" && <ShipButton checkId={id} readyToShip={readyToShip} />}
    </div>
  );
}
