import { daysUntil, dueState, type DueState } from "@/shared/format/due-dates";

/** Stock that can be issued today: what is available less what is already set aside for production. */
/** Free to issue: the server's figure (usable stock less live holds) when it sends one; otherwise stock less reserved. */
export function freeToIssue(row: { available: number; reserved: number; free?: number | null }): number {
  return typeof row.free === "number" ? Math.max(row.free, 0) : Math.max(row.available - row.reserved, 0);
}

/** Where a batch stands against its expiry date: expired, expiring within 60 days, or fine. A batch with no expiry date never expires. */
export function expiryState(expiryDate: string | null | undefined, now = new Date()): DueState {
  return dueState(daysUntil(expiryDate, now));
}
