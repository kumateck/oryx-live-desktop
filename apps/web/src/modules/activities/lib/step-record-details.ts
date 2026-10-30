import { formatQuantityNumber, toLargestUnit, type QuantityOrigin } from "@/shared/units/quantity";

type Person = { firstName?: string | null | undefined; lastName?: string | null | undefined; name?: string | null | undefined } | null | undefined;
export function recordPerson(person: Person): string | null {
  return person?.name?.trim() || [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim() || null;
}
export function recordQuantity(value: number | null | undefined, unit?: string | null, origin: QuantityOrigin = "entered"): string | null {
  if (value === null || value === undefined) return null;
  return unit ? toLargestUnit(value, unit, origin)?.text ?? null : formatQuantityNumber(value, origin);
}
export const recordedBoolean = (value: boolean | null | undefined) => value === true ? "Yes" : value === false ? "No" : null;
const batchStates = ["Requested", "Testing", "Approved", "Rejected", "Test taken", "Checked", "Quarantine", "Available"];
export const batchRecordStatus = (status: number | null | undefined) => status === null || status === undefined ? "Not recorded" : batchStates[status] ?? "Unknown";

type Tone = "done" | "waiting" | "problem";
/** Status colour for each record type, keyed by the backend's status numbers. */
export const atrTone = (status: number | null | undefined): Tone => status === 5 ? "done" : status === 7 ? "problem" : "waiting";
export const batchRecordTone = (status: number | null | undefined): Tone => status === 2 || status === 7 ? "done" : status === 3 ? "problem" : "waiting";
export const requisitionTone = (status: number | null | undefined): Tone => status === 3 ? "done" : status === 4 ? "problem" : "waiting";
export const extraMaterialTone = (status: number | null | undefined): Tone => status === 2 ? "done" : "waiting";
export function transferStatus(record: { isFulfilled?: boolean | null | undefined; isApproved?: boolean | null | undefined; approved?: boolean | null | undefined }): { label: string; tone: Tone } {
  if (record.isFulfilled === true) return { label: "Fulfilled", tone: "done" };
  if (record.isApproved === true) return { label: "Accepted by warehouse", tone: "done" };
  if (record.approved === true) return { label: "Approved · awaiting receipt", tone: "waiting" };
  return { label: "Awaiting approval", tone: "waiting" };
}
/** A share of a whole, for notes such as "95% of transferred". Null when it cannot be worked out. */
export function recordShare(part: number | null | undefined, whole: number | null | undefined): string | null {
  if (part === null || part === undefined || !whole || whole <= 0) return null;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format((part / whole) * 100)}%`;
}
