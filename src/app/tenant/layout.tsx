import { redirect } from "next/navigation";
import { getCurrentUserAndRoles, getDisplayName } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles } = await getCurrentUserAndRoles();

  if (!user) redirect("/login");
  if (!roles.includes("tenant")) redirect("/");

  return (
    <DashboardShell activeRole="tenant" roles={roles} userLabel={getDisplayName(user)}>
      {children}
    </DashboardShell>
  );
}
