import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto max-w-sm">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success-100 text-success-600">
            <PartyPopper className="size-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Thanks!</h1>
          <p className="text-sm text-slate-500">
            We&apos;re confirming your payment with PayFast — this usually takes
            a few seconds. The check&apos;s status will update automatically
            once it clears.
          </p>
          <Button asChild className="mt-2 w-full">
            <Link href={`/landlord/checks/${id}`}>View check status</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
