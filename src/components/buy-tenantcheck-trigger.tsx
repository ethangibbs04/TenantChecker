"use client";

import { useAuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

export function BuyTenantcheckTrigger({
  className,
  size,
}: {
  className?: string;
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  const { openSignup } = useAuthDialog();

  return (
    <Button
      size={size}
      className={className}
      onClick={() => openSignup("/landlord/checks/new")}
    >
      Buy Tenantcheck
    </Button>
  );
}
