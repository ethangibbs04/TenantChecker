import Link from "next/link";
import { ShieldCheck, FileCheck2, Sparkles } from "lucide-react";
import { getCurrentUserAndRoles, getDisplayName } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BuyTenantcheckButton } from "@/components/buy-tenantcheck-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUSES = [
  "Awaiting Tenant Consent",
  "Awaiting Payment",
  "Awaiting Tenant Application Submission",
  "Processing / Awaiting Admin Approval",
  "Completed",
];

export default async function ProductPage() {
  const { user, roles, pendingActionCounts, lastActiveRole } = await getCurrentUserAndRoles();
  const auth = user
    ? { userLabel: getDisplayName(user), roles, pendingActionCounts, activeRole: lastActiveRole }
    : null;

  return (
    <>
      <SiteHeader auth={auth} />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-medium text-navy-900">
            Everything you need to vet a tenant, in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Tenantcheck replaces scattered emails, paper consent forms, and
            manual credit report requests with a single digital pipeline —
            from first contact to a completed vetting package.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-16">
            <div className="grid items-center gap-8 sm:grid-cols-2">
              <div>
                <div className="flex size-12 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-medium text-navy-900">
                  Verified credit checks
                </h2>
                <p className="mt-2 text-slate-500">
                  We procure each credit report directly from TPN, the
                  rental-industry credit bureau used across South Africa, so
                  you&apos;re working from the same data the professionals use —
                  not a generic consumer credit score.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-400">
                Credit report preview
              </div>
            </div>

            <div className="grid items-center gap-8 sm:grid-cols-2">
              <div className="order-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-400 sm:order-1">
                Digital consent + application preview
              </div>
              <div className="order-1 sm:order-2">
                <div className="flex size-12 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <FileCheck2 className="size-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-medium text-navy-900">
                  Digital consent &amp; applications
                </h2>
                <p className="mt-2 text-slate-500">
                  Your tenant signs a POPIA-compliant consent form and fills
                  out a comprehensive application entirely on their own
                  device. No printing, no scanning, no lost paperwork.
                </p>
              </div>
            </div>

            <div className="grid items-center gap-8 sm:grid-cols-2">
              <div>
                <div className="flex size-12 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <Sparkles className="size-6" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-medium text-navy-900">
                  AI-powered recommendations
                </h2>
                <p className="mt-2 text-slate-500">
                  Once the credit check and application are in, we generate
                  an AI summary and recommendation, reviewed by our team for
                  quality before your complete package is released.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-400">
                AI recommendation preview
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-100 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-display text-2xl font-medium text-navy-900">
              Track every step, like a parcel
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
              Your landlord dashboard shows exactly where each Tenantcheck
              stands, in real time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {STATUSES.map((status) => (
                <Badge key={status} variant="secondary">
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-medium text-navy-900">
            R350 per tenant
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            One flat price for the full package — credit check, application,
            and AI recommendation.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <BuyTenantcheckButton size="lg" />
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter loggedIn={!!user} />
    </>
  );
}
