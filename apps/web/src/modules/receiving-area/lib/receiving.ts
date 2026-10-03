import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { convertUnit, relatedUnits } from "@/shared/units/quantity";

export const receivingPath = "/warehouse/receiving-area";
export const receivingListPath = (status: ReceivingStatus, kind: MaterialKind) => `${receivingPath}?status=${status}&type=${kind}`;
export const createChecklistPath = (id: string) => `${receivingPath}/${id}/create-checklist`;
export const viewChecklistPath = (id: string) => `${receivingPath}/${id}/view-checklist`;
export const audit = { module: "Warehouse", subModule: "Receiving Area" } as const;

export const viewPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialsItems", 1: "CanViewPackagingMaterialsItems" };
export const checklistPermissions: Record<MaterialKind, string> = { 0: "CanCreateChecklistForRawMaterials", 1: "CanCreateChecklistForPackagingMaterials" };
export const grnPermissions: Record<MaterialKind, string> = { 0: "CanCreateGrnForRawMaterials", 1: "CanCreateGrnForPackagingMaterials" };

/** How far a delivered material has got in the store. The numbers are the server's. */
export const receivingStatus = { pending: 0, arrived: 1, checked: 2, grnGenerated: 3, distributed: 4 } as const;
export type ReceivingStatus = 0 | 1 | 2 | 3 | 4;
export const receivingStatusLabels: Record<ReceivingStatus, string> = { 0: "Waiting for checklist", 1: "Arrived", 2: "Checked", 3: "GRN created", 4: "Distributed" };
export const receivingTitles: Record<ReceivingStatus, string> = { 0: "Pending receiving", 1: "Arrived", 2: "Checked received", 3: "GRN created", 4: "Distributed received" };
export const readStatus = (value: string | null): ReceivingStatus => value === "1" || value === "2" || value === "3" || value === "4" ? Number(value) as ReceivingStatus : 0;

/** A checklist is written once, before anything else has happened to the delivery. */
export const canCreateChecklist = (status: ReceivingStatus) => status === receivingStatus.pending || status === receivingStatus.arrived;
/** A goods received note covers materials whose checklist recorded at least one batch, and that are not on a note yet. */
export const canJoinGrn = (row: { status: ReceivingStatus; batches: number }) => row.status === receivingStatus.checked && row.batches > 0;

/** The state of the containers, and of the vehicle that brought them. The numbers are the server's. */
export const intactnessOptions = [{ value: "0", label: "Good" }, { value: "1", label: "Bad" }] as const;
export const carrierOptions = [{ value: "1", label: "Clean" }, { value: "0", label: "Dirty" }, { value: "2", label: "Wet" }, { value: "3", label: "Insect infested" }, { value: "4", label: "Excessive dust" }, { value: "5", label: "Damaged" }] as const;
export const intactnessLabel = (value: number | null) => intactnessOptions.find((item) => item.value === String(value))?.label ?? "Not recorded";
export const carrierLabel = (value: number | null) => carrierOptions.find((item) => item.value === String(value))?.label ?? "Not recorded";

/** Quantities are typed in the largest unit of the material's family and stored in the material's own unit. */
export const enteredUnit = (unit: string | null) => relatedUnits(unit).at(-1) ?? unit ?? "";
export const toStored = (value: number, unit: string | null) => convertUnit(value, enteredUnit(unit), unit) ?? value;
export const toEntered = (value: number, unit: string | null) => convertUnit(value, unit, enteredUnit(unit)) ?? value;

interface BatchInput { containers: number; perContainer: number }
const filled = (value: number) => Number.isFinite(value) ? value : 0;
/** What the batches typed so far add up to, in the unit they are typed in. */
export const batchesTotal = (batches: readonly BatchInput[]) => batches.reduce((sum, batch) => sum + filled(batch.containers) * filled(batch.perContainer), 0);
/** Whether the batches account for exactly what was delivered. Compared in the stored unit, to a thousandth, so decimal entry cannot fail it. */
export function accountsFor(batches: readonly BatchInput[], delivered: number, unit: string | null): boolean {
  return Math.abs(toStored(batchesTotal(batches), unit) - delivered) <= Math.max(1e-6, Math.abs(delivered) * 1e-9);
}

/** The next goods received note number in a series: store / RM or PM / two-digit year / serial. */
export function grnPrefix(kind: MaterialKind, beta: boolean, year: number): string {
  return `${beta ? "BWH" : "WHD"}/${kind === 0 ? "RM" : "PM"}/${String(year).slice(-2)}`;
}
export const grnNumber = (prefix: string, used: number) => `${prefix}/${String(used + 1).padStart(3, "0")}`;
