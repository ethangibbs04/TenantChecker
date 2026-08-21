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
