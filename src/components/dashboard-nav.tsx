import Link from "next/link";
import type { Role } from "@/lib/auth";

const ROLE_LABEL: Record<Role, string> = {
  landlord: "Landlord",
  tenant: "Tenant",
  admin: "Admin",
};

export function DashboardNav({
  activeRole,
  roles,
}: {
  activeRole: Role;
  roles: Role[];
}) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold">Tenantcheck</span>
        <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
          {ROLE_LABEL[activeRole]} view
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {roles.length > 1 &&
          roles
            .filter((r) => r !== activeRole)
            .map((r) => (
              <Link key={r} href={`/${r}`} className="underline">
                Switch to {ROLE_LABEL[r]}
              </Link>
            ))}
        <form action="/logout" method="post">
          <button type="submit" className="underline">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
