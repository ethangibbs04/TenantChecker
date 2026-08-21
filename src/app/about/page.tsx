import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-medium text-navy-900">
            About Tenantcheck
          </h1>
          <p className="mt-6 text-lg text-slate-500">
            Vetting a tenant properly shouldn&apos;t mean chasing paperwork,
            manually requesting credit reports, and juggling emails between
            a prospective tenant, a credit bureau, and yourself. Tenantcheck
            exists to turn that scattered process into one digital pipeline
            — so private landlords can make confident decisions without the
            admin overhead.
          </p>
          <p className="mt-4 text-lg text-slate-500">
            We built Tenantcheck around three things every landlord actually
            needs: a verified credit check, a properly consented and
            complete application, and a clear recommendation — reviewed by
            a real person, not just an algorithm — pulled together into one
            package you can trust.
          </p>
          <p className="mt-4 text-lg text-slate-500">
            We&apos;re a small, focused team, and we&apos;re just getting started.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/product">See the product</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Get in touch</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
