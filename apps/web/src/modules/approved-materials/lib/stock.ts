import { daysUntil, dueState, type DueState } from "@/shared/format/due-dates";

/** Stock that can be issued today: what is available less what is already set aside for production. */
export function freeToIssue(row: { available: number; reserved: number }): number {
  return Math.max(row.available - row.reserved, 0);
}

/** Where a batch stands against its expiry date: expired, expiring within 60 days, or fine. A batch with no expiry date never expires. */
export function expiryState(expiryDate: string | null | undefined, now = new Date()): DueState {
  return dueState(daysUntil(expiryDate, now));
}
