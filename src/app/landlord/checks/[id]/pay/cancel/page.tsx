import Link from "next/link";

export default async function LandlordPayCancelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Payment cancelled</h1>
      <p className="mt-2 text-neutral-600">
        No payment was taken. You can try again whenever you&apos;re ready.
      </p>
      <Link
        href={`/landlord/checks/${id}/pay`}
        className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
      >
        Try again
      </Link>
    </main>
  );
}
