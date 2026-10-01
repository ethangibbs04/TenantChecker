import { Skeleton } from "@/components/ui/skeleton";

// Shape matches a single-card form/handoff page: buy-tenantcheck, the
// PayFast pay/return screens, consent, application.
export function FormCardSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
