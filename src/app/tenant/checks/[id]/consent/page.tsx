import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CONSENT_TEXT } from "@/lib/consent";
import { submitConsent } from "@/app/tenant/actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ConsentPage({
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
  // landlord of the check, and this is the tenant-facing consent flow.
  const { data: check } = await supabase
    .from("checks")
    .select("id, status, properties(label)")
    .eq("id", id)
    .eq("tenant_id", user.id)
    .single();

  if (!check) notFound();

  if (check.status !== "AWAITING_CONSENT") {
    redirect(`/tenant`);
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <PageHeader
        title="Consent to a Tenantcheck"
        description={`${(check.properties as unknown as { label: string } | null)?.label} has requested a Tenantcheck vetting for you.`}
      />

      <Card>
        <CardContent className="flex flex-col gap-3">
          <Badge variant="warning" className="w-fit uppercase tracking-wide">
            Draft — pending legal review
          </Badge>
          <div className="max-h-80 overflow-y-auto pr-1">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
              {CONSENT_TEXT}
            </pre>
          </div>
        </CardContent>
      </Card>

      <form action={submitConsent} className="flex flex-col gap-4">
        <input type="hidden" name="check_id" value={check.id} />
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            required
            className="mt-0.5 size-4 rounded border-input accent-navy-700"
          />
          I have read and agree to the above.
        </label>
        <Button type="submit" className="w-fit">
          Agree and continue
        </Button>
      </form>
    </div>
  );
}
