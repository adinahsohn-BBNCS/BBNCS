export type TicketCategory = "managed_it" | "backup" | "it_support" | "other";
export type TicketUrgency = "normal" | "urgent" | "emergency";
export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_client"
  | "scheduled"
  | "resolved"
  | "closed";

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  managed_it: "Managed IT",
  backup: "Backup",
  it_support: "IT Support",
  other: "Other",
};

export const URGENCY_LABELS: Record<TicketUrgency, string> = {
  normal: "Normal",
  urgent: "Urgent",
  emergency: "Emergency",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on Client",
  scheduled: "Scheduled",
  resolved: "Resolved",
  closed: "Closed",
};

export function ticketPublicUrl(accessToken: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://bbncs.com");
  return `${base}/support/ticket/?t=${encodeURIComponent(accessToken)}`;
}

export function formatTicketNumber(n: number): string {
  return `T-${n}`;
}
