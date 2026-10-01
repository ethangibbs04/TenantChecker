export const CHECK_STATUSES = [
  "AWAITING_CONSENT",
  "AWAITING_PAYMENT",
  "AWAITING_APPLICATION",
  "PROCESSING",
  "COMPLETED",
] as const;

export type CheckStatus =
  | (typeof CHECK_STATUSES)[number]
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export const STATUS_LABEL: Record<CheckStatus, string> = {
  AWAITING_CONSENT: "Awaiting tenant consent",
  AWAITING_PAYMENT: "Awaiting payment",
  AWAITING_APPLICATION: "Awaiting tenant application",
  PROCESSING: "Processing / awaiting admin approval",
  COMPLETED: "Completed — ready to view",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

// Shared "My Activity" split, used identically by the landlord and tenant
// dashboards: a check is done (History) once it hits one of these, regardless
// of role.
export const HISTORY_STATUSES: CheckStatus[] = [
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
];

// Statuses where the ball is specifically in that role's court — the same
// source of truth drives the "My Activity" nav notification dot and the
// To-Do/Active split below, so they can't drift apart.
export const LANDLORD_ACTIONABLE_STATUSES: CheckStatus[] = ["AWAITING_PAYMENT"];
export const TENANT_ACTIONABLE_STATUSES: CheckStatus[] = [
  "AWAITING_CONSENT",
  "AWAITING_APPLICATION",
];
// Admin isn't scoped to any one check — every PROCESSING check is in their
// court until shipped, same "actionable" concept as the other two roles.
export const ADMIN_ACTIONABLE_STATUSES: CheckStatus[] = ["PROCESSING"];
// The complement: every non-terminal, non-actionable status — i.e. admin's
// "In Progress" bucket (waiting on the tenant or landlord, not on admin).
export const ADMIN_IN_PROGRESS_STATUSES: CheckStatus[] = [
  "AWAITING_CONSENT",
  "AWAITING_PAYMENT",
  "AWAITING_APPLICATION",
];

export type ActivitySection = "todo" | "active" | "history";

// A check is the same objective status for everyone, but which "My
// Activity" section it belongs in depends on whose turn it is: e.g.
// AWAITING_PAYMENT is the landlord's To-Do (they need to pay) but the
// tenant's Active (in progress, not blocked on the tenant).
export function getActivitySection(
  status: CheckStatus,
  actionableStatuses: CheckStatus[]
): ActivitySection {
  if (HISTORY_STATUSES.includes(status)) return "history";
  if (actionableStatuses.includes(status)) return "todo";
  return "active";
}
