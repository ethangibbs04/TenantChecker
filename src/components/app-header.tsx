"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { Role } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/mobile-nav";

const ROLE_LABEL: Record<Role, string> = {
  landlord: "Landlord",
  tenant: "Tenant",
  admin: "Admin",
};

export function AppHeader({
  activeRole,
  roles,
  userLabel,
  navItems = [],
}: {
  activeRole: Role;
  roles: Role[];
  userLabel: string;
  navItems?: { label: string; href: string }[];
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href={`/${activeRole}`} className="flex items-center gap-3">
            <Logo size="sm" />
          </Link>
          <Badge variant="secondary">{ROLE_LABEL[activeRole]}</Badge>
        </div>

        {navItems.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="hidden items-center md:flex">
          <UserMenu activeRole={activeRole} roles={roles} userLabel={userLabel} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu />
        </Button>
      </div>

      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        activeRole={activeRole}
        roles={roles}
        userLabel={userLabel}
        navItems={navItems}
      />
    </header>
  );
}
