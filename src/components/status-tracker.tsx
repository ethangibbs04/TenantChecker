import { Check } from "lucide-react";
import { CHECK_STATUSES, STATUS_LABEL, type CheckStatus } from "@/lib/checks";
import { Badge } from "@/components/ui/badge";

const TERMINAL_STATES: CheckStatus[] = ["DECLINED", "CANCELLED", "EXPIRED"];

export function StatusTracker({ status }: { status: CheckStatus }) {
  if (TERMINAL_STATES.includes(status)) {
    return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>;
  }

  const currentIndex = CHECK_STATUSES.indexOf(
    status as (typeof CHECK_STATUSES)[number]
  );

  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {CHECK_STATUSES.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex items-center">
            <Badge
              variant={active ? "default" : done ? "success" : "secondary"}
              className="gap-1 px-2.5 py-1 text-xs transition-colors duration-300"
            >
              {done && <Check aria-hidden="true" />}
              {STATUS_LABEL[step]}
            </Badge>
            {i < CHECK_STATUSES.length - 1 && (
              <span
                className={`mx-1.5 h-0.5 w-4 shrink-0 rounded-full transition-colors duration-300 sm:w-6 ${
                  done ? "bg-success-600" : "bg-slate-200"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
