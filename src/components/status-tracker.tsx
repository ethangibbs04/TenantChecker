import { CHECK_STATUSES, STATUS_LABEL, type CheckStatus } from "@/lib/checks";

export function StatusTracker({ status }: { status: CheckStatus }) {
  const terminalStates: CheckStatus[] = ["DECLINED", "CANCELLED", "EXPIRED"];

  if (terminalStates.includes(status)) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {STATUS_LABEL[status]}
      </div>
    );
  }

  const currentIndex = CHECK_STATUSES.indexOf(
    status as (typeof CHECK_STATUSES)[number]
  );

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {CHECK_STATUSES.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? "bg-black text-white"
                  : done
                    ? "bg-green-100 text-green-700"
                    : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {STATUS_LABEL[step]}
            </span>
            {i < CHECK_STATUSES.length - 1 && (
              <span className="text-neutral-300">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
