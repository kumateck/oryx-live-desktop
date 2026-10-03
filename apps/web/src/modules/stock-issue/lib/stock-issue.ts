import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const stockIssuePath = "/warehouse/stock-requisition";
export const stockIssueListPath = (kind: MaterialKind) => `${stockIssuePath}?type=${kind}`;
export const issueRequisitionPath = (id: string, kind: MaterialKind) => `${stockIssuePath}/${id}?type=${kind}`;
export const audit = { module: "Warehouse", subModule: "Stock Requisitions" } as const;
export const viewPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialRequisitions", 1: "CanViewPackagingMaterialRequisitions" };
export const issuePermissions: Record<MaterialKind, string> = { 0: "CanIssueRawMaterialRequisitions", 1: "CanIssuePackagingMaterialRequisitions" };

/** A batch is not issued on or after the day it expires. */
export function expiredOrDue(expiry: string | null, today: Date = new Date()): boolean {
  if (!expiry) return false;
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return false;
  const day = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return day(date) <= day(today);
}

/**
 * A batch number as it should read. Some imported numbers were saved in scientific notation ("1.2E+5");
 * the digits are shifted as text, so a number is never rounded.
 */
export function batchNumber(value: string | null | undefined): string {
  const text = value?.trim();
  if (!text || text.toUpperCase() === "N/A") return "–";
  const scientific = /^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(text);
  if (!scientific) return text;
  const [, sign = "", whole = "", fraction = "", power = "0"] = scientific;
  const exponent = Number(power);
  const point = whole.length + exponent;
  const digits = whole + fraction;
  if (!Number.isSafeInteger(exponent) || Math.abs(point) > 100) return text;
  const expanded = point <= 0 ? `0.${"0".repeat(-point)}${digits}` : point >= digits.length ? `${digits}${"0".repeat(point - digits.length)}` : `${digits.slice(0, point)}.${digits.slice(point)}`;
  return `${sign}${expanded}`;
}

interface Line { quantity: number; batches: readonly { quantity: number; expires: string | null }[] }
/** What the batches set aside for a line fall short of what was asked for, to a thousandth of a unit. */
export const shortfall = (line: Line) => { const short = line.quantity - line.batches.reduce((sum, batch) => sum + batch.quantity, 0); return short > 1e-6 ? short : 0; };

/**
 * Why a stock requisition cannot be issued, or null when it can. Stock leaves the store only against an
 * approved requisition, once, and never from a batch that has expired.
 */
export function issueBlock(requisition: { approved: boolean; status: number; items: readonly Line[] }, today: Date = new Date()): string | null {
  if (!requisition.approved) return "This requisition is waiting for approval. Stock is issued once it is approved.";
  if (requisition.status === 3) return "This requisition has already been issued.";
  if (requisition.status === 4) return "This requisition was rejected.";
  if (requisition.items.length === 0) return "This requisition has no materials to issue.";
  if (requisition.items.some((line) => line.batches.some((batch) => expiredOrDue(batch.expires, today)))) return "A batch set aside for this requisition has expired or expires today. Swap it for another batch before issuing.";
  if (requisition.items.some((line) => line.batches.length === 0)) return "No stock is set aside for one or more materials on this requisition.";
  return null;
}
