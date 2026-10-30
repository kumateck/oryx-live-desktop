import type { SelectOption } from "@/shared/forms/form-wizard-types";
import type { ComparisonDto, LineDto, LineStatus, LineUpdate, MigrationDto, WarehouseDto } from "../api/stock-migration-api";
import type { LineFormValues } from "../schemas/stock-migration-schema";
import { uploadCenterPath, uploadPermissions } from "./upload-center";

/** Stock migration replaces a department's stock, so it is gated on the key that changes stock, as the stock upload is. */
export const migrationPermission = uploadPermissions.material;
export const migrationPath = (id: string) => `${uploadCenterPath}/stock-migrations/${id}`;

export const massUnits = ["kg", "g", "mg"] as const;
export const volumeUnits = ["L", "ml"] as const;

export const lineStatus = { ok: 0, warning: 1, blocked: 2, skipped: 3, excluded: 4 } as const satisfies Record<string, LineStatus>;
export const lineStatusLabels: Record<LineStatus, string> = { 0: "Ready", 1: "Check", 2: "Needs fixing", 3: "No quantity", 4: "Left out" };
export const migrationStatusLabels = { 0: "Draft", 1: "Approved", 2: "Discarded" } as const;

/** The status filter chips, with how many rows each holds. */
export function statusCounts(migration: MigrationDto): { status: LineStatus; label: string; count: number }[] {
  return [
    { status: lineStatus.blocked, label: lineStatusLabels[2], count: migration.blocked ?? 0 },
    { status: lineStatus.warning, label: lineStatusLabels[1], count: migration.warning ?? 0 },
    { status: lineStatus.ok, label: lineStatusLabels[0], count: migration.ok ?? 0 },
    { status: lineStatus.skipped, label: lineStatusLabels[3], count: migration.skipped ?? 0 },
    { status: lineStatus.excluded, label: lineStatusLabels[4], count: migration.excluded ?? 0 },
  ];
}

export function isDraft(migration: MigrationDto | undefined): boolean {
  return migration?.status === 0;
}

/** Why approval is not possible yet, or null when it is. */
export function approvalBlocker(migration: MigrationDto): string | null {
  if (!isDraft(migration)) return "This migration has already been approved or discarded.";
  if ((migration.blocked ?? 0) > 0) return `${migration.blocked} row(s) still need fixing or leaving out.`;
  if ((migration.ok ?? 0) + (migration.warning ?? 0) === 0) return "No row has stock to load.";
  return null;
}

/** The material a row resolves to, or what the sheet said when it resolves to none. */
export function materialLabel(line: LineDto): { code: string; name: string } {
  return line.resolvedMaterialCode
    ? { code: line.resolvedMaterialCode, name: line.resolvedMaterialName ?? "" }
    : { code: line.materialCode ?? line.sheetMaterialCode ?? "", name: line.sheetMaterialName ?? "" };
}

/** A date input value ("YYYY-MM") for a month the server sent as an ISO date. */
export function monthInput(value: string | null | undefined): string {
  return /^(\d{4}-\d{2})/.exec(value ?? "")?.[1] ?? "";
}

/** The ISO date for a "YYYY-MM" input, the first of the month in UTC. */
export function monthValue(input: string): string | null {
  return /^\d{4}-\d{2}$/.test(input) ? `${input}-01T00:00:00Z` : null;
}

export type ComparisonChange = "removed" | "added" | "changed" | "same";

/** How a material's stock changes on approval. Removed stock is the case to look at: the sheet does not have it. */
export function comparisonChange(row: ComparisonDto): ComparisonChange {
  const before = row.current ?? 0;
  const after = row.new ?? 0;
  if (before > 0 && after === 0) return "removed";
  if (before === 0 && after > 0) return "added";
  return before === after ? "same" : "changed";
}

/** Every shelf of the department's stores, labelled with its store. */
export function shelfOptions(warehouses: readonly WarehouseDto[] | null | undefined): SelectOption[] {
  return (warehouses ?? []).flatMap((store) => (store.shelves ?? []).flatMap((shelf) =>
    shelf.id ? [{ value: shelf.id, label: `${shelf.name ?? shelf.code ?? "Shelf"} · ${store.name ?? "Store"}` }] : []));
}

/** The dialog's starting values: what the row is read as now. */
export function lineFormValues(line: LineDto, shelves: readonly SelectOption[]): LineFormValues {
  const shelfId = line.shelfId ?? line.resolvedShelfId;
  const picked = line.materialId ?? null;
  return {
    material: picked && line.resolvedMaterialId === picked ? { value: picked, label: `${line.resolvedMaterialCode ?? ""} ${line.resolvedMaterialName ?? ""}`.trim() } : null,
    materialCode: line.materialCode ?? "",
    shelf: shelves.find((shelf) => shelf.value === shelfId) ?? null,
    batchNumber: line.batchNumber ?? "",
    unitSymbol: line.unitSymbol ?? "",
    quantityInSheet: line.quantityInSheet ?? null,
    manufactured: monthInput(line.manufacturingDate) || null,
    expiry: monthInput(line.expiryDate) || null,
    excluded: line.excluded ?? false,
  };
}

/** The save request: a picked material or shelf wins over the code or shelf name the sheet gave. */
export function lineRequest(line: LineDto, values: LineFormValues): LineUpdate {
  const quantity = values.quantityInSheet;
  return {
    materialCode: values.materialCode || null,
    materialId: values.material?.value ?? null,
    warehouseName: line.warehouseName ?? null,
    shelfName: line.shelfName ?? null,
    shelfId: values.shelf?.value ?? null,
    batchNumber: values.batchNumber || null,
    unitSymbol: values.unitSymbol || null,
    quantityInSheet: quantity !== null && Number.isFinite(quantity) && quantity > 0 ? quantity : null,
    manufacturingDate: values.manufactured ? monthValue(values.manufactured) : null,
    expiryDate: values.expiry ? monthValue(values.expiry) : null,
    excluded: values.excluded,
  };
}
