"use client";

import { useRef } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import type { Role } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsFor(label: string) {
  return label.trim().slice(0, 1).toUpperCase() || "?";
}

export function UserMenu({
  activeRole,
  roles,
  userLabel,
}: {
  /** Set when rendered inside a role-scoped dashboard; omitted on marketing
   * pages / the multi-role picker, where there's no "current" role to switch
   * away from — every role is just an equally-valid destination. */
  activeRole?: Role;
  roles: Role[];
  userLabel: string;
}) {
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const otherRoles = activeRole ? roles.filter((r) => r !== activeRole) : roles;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-navy-700 text-xs font-medium text-white transition-colors outline-none hover:bg-navy-600 focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Account menu"
          >
            {initialsFor(userLabel)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal text-slate-500">
            {userLabel}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {otherRoles.length > 0 && (
            <>
              {otherRoles.map((r) => (
                <DropdownMenuItem key={r} asChild>
                  <Link href={`/${r}`}>
                    {activeRole ? `Switch to ${ROLE_LABEL[r]}` : `Go to ${ROLE_LABEL[r]} dashboard`}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => logoutFormRef.current?.requestSubmit()}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form ref={logoutFormRef} action="/logout" method="post" className="hidden" />
    </>
  );
}
