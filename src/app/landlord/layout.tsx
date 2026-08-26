import { redirect } from "next/navigation";
import { getCurrentUserAndRoles, getDisplayName } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles, pendingActionCounts } = await getCurrentUserAndRoles();

  // Deliberately no `roles.includes("landlord")` check: nobody has the
  // landlord role until they've actually bought a Tenantcheck
  // (create_check grants it), and /landlord/checks/new — the buy flow
  // itself — lives under this same layout. Gating the whole tree on a
  // role you can only earn by getting past the gate would lock everyone
  // out. Pages here are otherwise scoped to the signed-in user's own data
  // (see the `landlord_id` filters below), so a "pending" or tenant-only
  // visitor just sees an empty dashboard with a prompt to buy.
  if (!user) redirect("/login");

  return (
    <DashboardShell
      activeRole="landlord"
      roles={roles}
      userLabel={getDisplayName(user)}
      pendingActionCounts={pendingActionCounts}
    >
      {children}
    </DashboardShell>
  );
}
