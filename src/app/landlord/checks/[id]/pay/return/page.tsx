import Link from "next/link";

// PayFast redirects the browser here after checkout, but this is not
// authoritative — actual confirmation comes from the server-to-server
// ITN webhook (/api/payfast/notify), which may land slightly after this
// page loads.
export default async function LandlordPayReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Thanks!</h1>
      <p className="mt-2 text-neutral-600">
        We&apos;re confirming your payment with PayFast — this usually takes
        a few seconds. The check&apos;s status will update automatically
        once it clears.
      </p>
      <Link
        href={`/landlord/checks/${id}`}
        className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
      >
        View check status
      </Link>
    </main>
  );
}
