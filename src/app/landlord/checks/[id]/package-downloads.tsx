"use client";

import { DOCUMENT_TYPE_LABEL } from "@/lib/application-form";

export function PackageDownloads({
  checkId,
  hasApplicationForm,
  documents,
}: {
  checkId: string;
  hasApplicationForm: boolean;
  documents: { id: string; document_type: string }[];
}) {
  const items = [
    ...(hasApplicationForm
      ? [
          {
            href: `/api/checks/${checkId}/application-form/download`,
            label: "Application form",
          },
        ]
      : []),
    ...documents.map((doc) => ({
      href: `/api/documents/${doc.id}/download`,
      label: DOCUMENT_TYPE_LABEL[doc.document_type] ?? doc.document_type,
    })),
  ];

  function downloadAll() {
    for (const item of items) {
      window.open(item.href, "_blank");
    }
  }

  return (
    <div className="rounded border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Your Tenantcheck package is ready</p>
        {items.length > 1 && (
          <button
            type="button"
            onClick={downloadAll}
            className="rounded border px-3 py-1 text-sm"
          >
            Download all
          </button>
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href} className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="rounded border px-3 py-1 underline"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
