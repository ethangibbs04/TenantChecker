import Link from "next/link";
import { getCurrentUserAndRoles } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BuyTenantcheckTrigger } from "@/components/buy-tenantcheck-trigger";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

export async function BuyTenantcheckButton({
  className,
  size,
}: {
  className?: string;
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  const { user } = await getCurrentUserAndRoles();

  if (!user) {
    return <BuyTenantcheckTrigger className={className} size={size} />;
  }

  return (
    <Button asChild size={size} className={className}>
      <Link href="/landlord/checks/new">Buy Tenantcheck</Link>
    </Button>
  );
}
