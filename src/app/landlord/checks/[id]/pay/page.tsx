import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildPaymentFields } from "@/lib/payfast";

// The landlord pays, not the tenant — per the spec, once the tenant
// consents the system notifies the landlord with a payment link. Data
// gathering only continues once the landlord's payment clears.
export default async function LandlordPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: check } = await supabase
    .from("checks")
    .select("id, status, tenant_full_name, properties(label)")
    .eq("id", id)
    .single();

  if (!check) notFound();

  if (check.status !== "AWAITING_PAYMENT") {
    redirect(`/landlord/checks/${id}`);
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("amount, currency")
    .eq("check_id", id)
    .single();

  const { data: landlordProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const notifyBase = process.env.PAYFAST_NOTIFY_BASE_URL || appUrl;
  const propertyLabel =
    (check.properties as unknown as { label: string } | null)?.label ?? "Tenantcheck";
  const landlordName = landlordProfile?.full_name || user.email || "Landlord";
  const [nameFirst, ...rest] = landlordName.split(" ");
  const nameLast = rest.join(" ") || nameFirst;

  const fields = buildPaymentFields({
    returnUrl: `${appUrl}/landlord/checks/${id}/pay/return`,
    cancelUrl: `${appUrl}/landlord/checks/${id}/pay/cancel`,
    notifyUrl: `${notifyBase}/api/payfast/notify`,
    nameFirst,
    nameLast,
    emailAddress: user.email!,
    mPaymentId: id,
    amount: Number(payment?.amount ?? 0).toFixed(2),
    itemName: `Tenantcheck - ${propertyLabel}`.slice(0, 100),
  });

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Payment required</h1>
      <p className="mt-2 text-neutral-600">
        {propertyLabel} — {check.tenant_full_name}
      </p>
      <p className="mt-1 text-lg font-medium">
        {payment?.currency} {Number(payment?.amount ?? 0).toFixed(2)}
      </p>
      <p className="mt-4 text-sm text-neutral-500">
        {check.tenant_full_name} has consented — pay now to start gathering
        their vetting documents. You&apos;ll be redirected to PayFast to
        complete it securely.
      </p>

      <form action={process.env.PAYFAST_URL} method="post" className="mt-6">
        {Object.entries(fields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Proceed to PayFast
        </button>
      </form>
    </main>
  );
}
