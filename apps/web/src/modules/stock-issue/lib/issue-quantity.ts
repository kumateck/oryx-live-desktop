/** Setting how much of a packaging line is issued when whole packs make it differ from the requirement. */
export const adjustIssuePermission = "CanAdjustPackagingMaterialIssueQuantity";

/** The shortest reason the server accepts. */
export const minimumReasonLength = 5;

interface IssueLine { kind: 0 | 1; quantity: number; issuedQuantity: number | null; batches: readonly { containerSize?: number | null }[] }

/** What will leave the store for the line: the supervisor's quantity, or the requirement. */
export const toIssue = (line: Pick<IssueLine, "quantity" | "issuedQuantity">) => line.issuedQuantity ?? line.quantity;

/** How far what is issued is from the requirement: positive over, negative under, zero as requested. */
export const issueDifference = (line: Pick<IssueLine, "quantity" | "issuedQuantity">) => Number((toIssue(line) - line.quantity).toPrecision(12));

/**
 * The nearest whole number of packs, when every batch set aside comes in the same known pack size: 18.75 from packs of
 * 10 suggests 20, from packs of 9 suggests 18. Null when the size is unknown or the requirement is already whole packs.
 */
export function suggestedIssue(line: IssueLine): number | null {
  if (line.kind !== 1) return null;
  const sizes = [...new Set(line.batches.map((batch) => batch.containerSize ?? null))];
  const size = sizes.length === 1 ? sizes[0] : null;
  if (!size || size <= 0) return null;
  const packs = Math.max(1, Math.round(line.quantity / size));
  const suggestion = Number((packs * size).toPrecision(12));
  return suggestion === line.quantity ? null : suggestion;
}
