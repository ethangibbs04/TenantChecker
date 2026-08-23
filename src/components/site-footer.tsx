import Link from "next/link";
import { Logo } from "@/components/logo";

const COMPANY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const ACCOUNT_LINKS = [
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
];

export function SiteFooter({ loggedIn = false }: { loggedIn?: boolean }) {
  const columns = loggedIn
    ? [{ heading: "Company", links: COMPANY_LINKS }]
    : [
        { heading: "Company", links: COMPANY_LINKS },
        { heading: "Account", links: ACCOUNT_LINKS },
      ];

  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo size="sm" variant="light" />
          <p className="max-w-xs text-sm text-slate-400">
            Digital tenant vetting for private landlords — credit checks,
            consent, and applications in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {column.heading}
              </p>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} Tenantcheck. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
