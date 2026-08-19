import { redirect } from "next/navigation";
import { getCurrentUserAndRoles } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles } = await getCurrentUserAndRoles();

  if (!user) redirect("/login");
  if (!roles.includes("landlord")) redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav activeRole="landlord" roles={roles} />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
