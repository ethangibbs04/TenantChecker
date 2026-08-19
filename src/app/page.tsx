import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndRoles } from "@/lib/auth";
import { claimLandlordRole } from "@/app/actions";

export default async function Home() {
  const { user, roles } = await getCurrentUserAndRoles();

  if (!user) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Tenantcheck</h1>
        <p className="mt-2 text-neutral-600">
          Digital tenant vetting for private landlords.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/signup" className="rounded bg-black px-4 py-2 text-white">
            Sign up
          </Link>
          <Link href="/login" className="rounded border px-4 py-2">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (roles.length === 1) {
    redirect(`/${roles[0]}`);
  }

  if (roles.length > 1) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-xl font-semibold">Choose a dashboard</h1>
        <div className="mt-6 flex flex-col gap-3">
          {roles.map((r) => (
            <Link
              key={r}
              href={`/${r}`}
              className="rounded border px-4 py-3 capitalize"
            >
              {r} dashboard
            </Link>
          ))}
        </div>
      </main>
    );
  }

  // No roles yet: the only self-serve path is landlord signup. Tenants
  // arrive via an invite link, which assigns the role automatically.
  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Welcome to Tenantcheck</h1>
      <p className="mt-2 text-neutral-600">
        Set up your landlord account to start vetting tenants.
      </p>
      <form action={claimLandlordRole} className="mt-6">
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Continue as a landlord
        </button>
      </form>
    </main>
  );
}
