"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Briefcase, Check, Home, Phone, User, Users } from "lucide-react";
import { saveApplicationDraft, submitApplication } from "@/app/tenant/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  APPLICATION_FORM_SECTIONS,
  APPLICATION_FORM_FIELDS,
  type ApplicationFormData,
  type ApplicationFormSection,
} from "@/lib/application-form";

const SECTION_ICON: Record<ApplicationFormSection, typeof User> = {
  "Personal details": User,
  "Current residence": Home,
  "Employment & income": Briefcase,
  Household: Users,
  "Emergency contact": Phone,
};

export function ApplicationForm({
  checkId,
  initialData,
  allDocumentsUploaded,
}: {
  checkId: string;
  initialData: ApplicationFormData | null;
  allDocumentsUploaded: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const sections = useMemo(
    () =>
      APPLICATION_FORM_SECTIONS.map((section) => ({
        section,
        fields: APPLICATION_FORM_FIELDS.filter((f) => f.section === section),
      })),
    []
  );

  function handleSaveDraft() {
    if (!formRef.current) return;
    setError(null);
    const formData = new FormData(formRef.current);
    startSaving(async () => {
      try {
        await saveApplicationDraft(formData);
        setSavedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleSubmit() {
    if (!formRef.current) return;
    setError(null);
    const formData = new FormData(formRef.current);
    startSubmitting(async () => {
      try {
        await submitApplication(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit");
      }
    });
  }

  return (
    <form ref={formRef} className="flex flex-col gap-6">
      <input type="hidden" name="check_id" value={checkId} />

      {sections.map(({ section, fields }) => {
        const Icon = SECTION_ICON[section];
        return (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Icon className="size-4 text-navy-700" aria-hidden="true" />
                {section}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const spanFull = field.type === "textarea";
                  return (
                    <div
                      key={field.name}
                      className={`flex flex-col gap-1.5 ${spanFull ? "sm:col-span-2" : ""}`}
                    >
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={field.name}
                          name={field.name}
                          defaultValue={initialData?.[field.name] ?? ""}
                          rows={2}
                        />
                      ) : field.type === "select" ? (
                        <Select
                          id={field.name}
                          name={field.name}
                          defaultValue={initialData?.[field.name] ?? ""}
                        >
                          <option value="" disabled>
                            Select…
                          </option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type ?? "text"}
                          defaultValue={initialData?.[field.name] ?? ""}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!allDocumentsUploaded && (
        <p className="rounded-lg bg-warning-100 px-3 py-2 text-sm text-warning-600">
          Upload all three documents above before you can submit.
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {savedAt && !error ? (
            <span className="flex items-center gap-1 text-success-600">
              <Check className="size-3.5" aria-hidden="true" />
              Draft saved at {savedAt.toLocaleTimeString()}
            </span>
          ) : (
            "Your progress is saved as a draft until you submit."
          )}
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !allDocumentsUploaded}
          >
            {isSubmitting ? "Submitting…" : "Submit application"}
          </Button>
        </div>
      </div>
    </form>
  );
}
