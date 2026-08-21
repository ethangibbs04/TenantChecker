"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const ROLE_LABEL: Record<Role, string> = {
  landlord: "Landlord",
  tenant: "Tenant",
  admin: "Admin",
};

export function MobileNav({
  open,
  onOpenChange,
  activeRole,
  roles,
  userLabel,
  navItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRole: Role;
  roles: Role[];
  userLabel: string;
  navItems: { label: string; href: string }[];
}) {
  const pathname = usePathname();
  const otherRoles = roles.filter((r) => r !== activeRole);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-slate-200 pb-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            {userLabel}
            <Badge variant="secondary">{ROLE_LABEL[activeRole]}</Badge>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}

          {otherRoles.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="px-3 pb-2 text-xs font-medium text-slate-500">
                Switch dashboard
              </p>
              {otherRoles.map((r) => (
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

        <form
          action="/logout"
          method="post"
          className="border-t border-slate-200 p-4"
        >
          <Button type="submit" variant="ghost" className="w-full justify-start text-danger-600 hover:bg-danger-100 hover:text-danger-600">
            <LogOut />
            Log out
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
