import type { Role } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export function DashboardShell({
  activeRole,
  roles,
  userLabel,
  navItems,
  children,
}: {
  activeRole: Role;
  roles: Role[];
  userLabel: string;
  navItems?: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        activeRole={activeRole}
        roles={roles}
        userLabel={userLabel}
        navItems={navItems}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
