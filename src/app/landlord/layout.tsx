import { redirect } from "next/navigation";
import { getCurrentUserAndRoles, getDisplayName } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles } = await getCurrentUserAndRoles();

  if (!user) redirect("/login");
  if (!roles.includes("landlord")) redirect("/");

  return (
    <DashboardShell
      activeRole="landlord"
      roles={roles}
      userLabel={getDisplayName(user)}
      navItems={[
        { label: "Dashboard", href: "/landlord" },
        { label: "Properties", href: "/landlord/properties" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
