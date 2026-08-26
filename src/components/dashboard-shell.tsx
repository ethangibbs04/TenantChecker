import type { PendingActionCounts, Role } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function DashboardShell({
  activeRole,
  roles,
  userLabel,
  pendingActionCounts,
  children,
}: {
  activeRole: Role;
  roles: Role[];
  userLabel: string;
  pendingActionCounts?: PendingActionCounts;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader auth={{ userLabel, roles, activeRole, pendingActionCounts }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <SiteFooter loggedIn />
    </div>
  );
}
