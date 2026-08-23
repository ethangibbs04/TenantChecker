import { Mail, Phone } from "lucide-react";
import { getCurrentUserAndRoles, getDisplayName } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";

// TODO: placeholder contact details — replace with the real business
// email/phone before this page goes live.
const CONTACT_EMAIL = "hello@tenantcheck.co.za";
const CONTACT_PHONE = "+27 00 000 0000";

export default async function ContactPage() {
  const { user, roles } = await getCurrentUserAndRoles();
  const auth = user ? { userLabel: getDisplayName(user), roles } : null;

  return (
    <>
      <SiteHeader auth={auth} />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-medium text-navy-900">
            Get in touch
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-500">
            Questions about a Tenantcheck, pricing, or setting up your
            landlord account — we&apos;re happy to help.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <Mail className="size-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-sm text-sky-600 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <Phone className="size-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-slate-900">Phone</p>
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="text-sm text-sky-600 hover:underline"
                >
                  {CONTACT_PHONE}
                </a>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter loggedIn={!!user} />
    </>
  );
}
