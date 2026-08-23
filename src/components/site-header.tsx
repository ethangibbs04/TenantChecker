"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import type { Role } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { useAuthDialog } from "@/components/auth-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const SITE_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];


export type SiteHeaderAuth = {
  userLabel: string;
  roles: Role[];
  /** Set when rendered inside a role-scoped dashboard route; omitted on
   * marketing pages and the multi-role picker, where there's no single
   * "current" role. */
  activeRole?: Role;
};

function NavLink({
  href,
  active,
  className = "",
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-sky-100 text-sky-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * The one header used everywhere — marketing pages (Home/Product/About/
 * Contact) and every dashboard route alike — so logging in adds account
 * context instead of swapping to a disconnected "app" shell. Site-level nav
 * (Home/Product/About Us/Contact) is always present; role-specific nav
 * items (e.g. the landlord's "My Activity") only show up when `auth` has an
 * `activeRole`, i.e. inside that role's own route tree.
 */
export function SiteHeader({
  auth,
  roleNavItems = [],
}: {
  auth: SiteHeaderAuth | null;
  roleNavItems?: { label: string; href: string }[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openLogin, openSignup } = useAuthDialog();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="sm" />
          </Link>
          {auth?.activeRole && (
            <Badge variant="secondary">{ROLE_LABEL[auth.activeRole]}</Badge>
          )}
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {SITE_NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href} className="px-3 py-1.5">
              {item.label}
            </NavLink>
          ))}
          {roleNavItems.length > 0 && (
            <>
              <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
              {roleNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  className="px-3 py-1.5"
                >
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {auth ? (
            <UserMenu activeRole={auth.activeRole} roles={auth.roles} userLabel={auth.userLabel} />
          ) : (
            <>
              <Button variant="outline" onClick={() => openLogin()}>
                Log in
              </Button>
              <Button onClick={() => openSignup()}>Sign up</Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0">
          <SheetHeader className="border-b border-slate-200 pb-4">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Logo size="sm" />
              {auth?.activeRole && <Badge variant="secondary">{ROLE_LABEL[auth.activeRole]}</Badge>}
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {SITE_NAV_ITEMS.map((item) => (
              <SheetClose asChild key={item.href}>
                <NavLink href={item.href} active={pathname === item.href} className="px-3 py-2">
                  {item.label}
                </NavLink>
              </SheetClose>
            ))}

            {roleNavItems.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="px-3 pb-2 text-xs font-medium text-slate-500 uppercase">
                  {auth?.activeRole ? ROLE_LABEL[auth.activeRole] : "Dashboard"}
                </p>
                {roleNavItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <NavLink
                      href={item.href}
                      active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      className="block px-3 py-2"
                    >
                      {item.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </div>
            )}

            {auth && auth.roles.length > (auth.activeRole ? 1 : 0) && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="px-3 pb-2 text-xs font-medium text-slate-500 uppercase">
                  {auth.activeRole ? "Switch dashboard" : "Your dashboards"}
                </p>
                {auth.roles
                  .filter((r) => r !== auth.activeRole)
                  .map((r) => (
                    <SheetClose asChild key={r}>
                      <Link
                        href={`/${r}`}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        {ROLE_LABEL[r]} dashboard
                      </Link>
                    </SheetClose>
                  ))}
              </div>
            )}
          </nav>

          {auth ? (
            <form action="/logout" method="post" className="border-t border-slate-200 p-4">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start text-danger-600 hover:bg-danger-100 hover:text-danger-600"
              >
                <LogOut />
                Log out
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-2 border-t border-slate-200 p-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false);
                  openLogin();
                }}
              >
                Log in
              </Button>
              <Button
                onClick={() => {
                  setMobileOpen(false);
                  openSignup();
                }}
              >
                Sign up
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
