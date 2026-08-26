"use client";

import { Download, PackageCheck } from "lucide-react";
import { DOCUMENT_TYPE_LABEL } from "@/lib/application-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-success-100 text-success-600">
              <PackageCheck className="size-4" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              Your Tenantcheck package is ready
            </p>
          </div>
          {items.length > 1 && (
            <Button type="button" variant="outline" size="sm" onClick={downloadAll}>
              Download all
            </Button>
          )}
        </div>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <span className="text-slate-700">{item.label}</span>
              <Button asChild variant="ghost" size="sm">
                <a href={item.href} target="_blank" rel="noreferrer">
                  <Download />
                  Download
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
