import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, FileCheck2, Sparkles } from "lucide-react";
import { getCurrentUserAndRoles } from "@/lib/auth";
import { claimLandlordRole } from "@/app/actions";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";
import { BuyTenantcheckButton } from "@/components/buy-tenantcheck-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified credit checks",
    description:
      "Every application includes a credit report sourced directly from TPN, South Africa's trusted rental credit bureau.",
  },
  {
    icon: FileCheck2,
    title: "Digital consent & applications",
    description:
      "Tenants sign POPIA-compliant consent and complete their full application online — no paperwork, no chasing signatures.",
  },
  {
    icon: Sparkles,
    title: "AI-powered recommendations",
    description:
      "Every completed package includes an AI-generated summary and recommendation, reviewed by our team before it reaches you.",
  },
];

const STEPS = [
  { title: "Initiate", description: "Submit your prospective tenant's details and buy a Tenantcheck." },
  { title: "Consent", description: "Your tenant signs a secure digital consent form." },
  { title: "Pay", description: "Once consent is signed, complete payment online — R350 per tenant." },
  { title: "We vet", description: "Your tenant completes their application while we run their credit check." },
  { title: "Review & ship", description: "Your complete package is reviewed and released to your dashboard." },
];

function MarketingHome() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section
          className="text-white"
          style={{ background: "var(--gradient-brand)" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
            <h1 className="font-display text-4xl font-medium sm:text-5xl">
              Know who you&apos;re renting to.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-100">
              Tenantcheck combines TPN credit checks, POPIA-compliant digital
              consent, and AI-powered recommendations into one seamless
              vetting pipeline built for private landlords.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <BuyTenantcheckButton size="lg" />
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/product">See how it works</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-slate-900">{feature.title}</p>
                  <p className="text-sm text-slate-500">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-slate-100 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-display text-2xl font-medium text-navy-900">
              How it works
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-5">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-8 items-center justify-center rounded-full bg-navy-700 text-sm font-medium text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-medium text-navy-900">
            Ready to vet your next tenant?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            R350 per tenant — get a full vetting package back in your
            dashboard once the process is complete.
          </p>
          <div className="mt-6">
            <BuyTenantcheckButton size="lg" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default async function Home() {
  const { user, roles } = await getCurrentUserAndRoles();

  if (!user) {
    return <MarketingHome />;
  }

  if (roles.length === 1) {
    redirect(`/${roles[0]}`);
  }

  if (roles.length > 1) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-xl font-semibold">Choose a dashboard</h1>
        <div className="mt-6 flex flex-col gap-3">
          {roles.map((r) => (
            <Link
              key={r}
              href={`/${r}`}
              className="rounded border px-4 py-3 capitalize"
            >
              {r} dashboard
            </Link>
          ))}
        </div>
      </main>
    );
  }

  // No roles yet: the only self-serve path is landlord signup. Tenants
  // arrive via an invite link, which assigns the role automatically.
  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Welcome to Tenantcheck</h1>
      <p className="mt-2 text-neutral-600">
        Set up your landlord account to start vetting tenants.
      </p>
      <form action={claimLandlordRole} className="mt-6">
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Continue as a landlord
        </button>
      </form>
    </main>
  );
}
