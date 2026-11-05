import type { LineUpdate } from "@/modules/upload-center/api/stock-migration-api";
import { openingBalancePermissions } from "@/modules/upload-center/lib/stock-migration";
import { utcBoundary } from "@/shared/format/date-boundary";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { convertUnit, isCountedUnit, isVolumeUnit } from "@/shared/units/quantity";

export const topUpsPath = "/warehouse/migration-top-ups";
export const newTopUpPath = `${topUpsPath}/new`;
export const topUpPath = (id: string) => `${topUpsPath}/${id}`;
/** Viewing needs opening-balance access; entering stock also needs the upload permission. Approval is a separate permission. */
export const topUpPermissions = openingBalancePermissions;
export const maxTopUpLines = 1000;

/** One lot entered on the page. The quantity is in the material's department unit. */
export interface TopUpLine {
  key: string;
  kind: MaterialKind;
  material: { id: string; code: string; name: string };
  unit: string;
  quantity: number;
  shelf: { id: string; label: string };
  batchNumber: string;
  arNumber: string;
  grn: string;
  manufactured: Date | null;
  expiry: Date | null;
  retest: Date | null;
}

const day = (date: Date | null) => date ? utcBoundary(date) : null;

/**
 * The server reads every weight in one unit and every liquid in one unit for a whole top-up, so each
 * quantity is sent in mg or ml; counted units go as they are.
 */
export const topUpUnits = { massUnit: "mg", volumeUnit: "ml" } as const;

export function topUpLineRequest(line: TopUpLine): LineUpdate {
  const sent = isCountedUnit(line.unit) ? line.quantity
    : convertUnit(line.quantity, line.unit, isVolumeUnit(line.unit) ? topUpUnits.volumeUnit : topUpUnits.massUnit) ?? line.quantity;
  return {
    materialId: line.material.id, materialCode: line.material.code, shelfId: line.shelf.id,
    batchNumber: line.batchNumber, unitSymbol: line.unit, quantityInSheet: sent,
    arNumber: line.arNumber || null, grn: line.grn || null,
    manufacturingDate: day(line.manufactured), expiryDate: day(line.expiry), retestDate: day(line.retest),
    excluded: false,
  };
}

/**
 * The same material and batch number may not be entered twice on one top-up. Lines without a batch
 * number are never the same lot: each is kept as its own lot.
 */
export function sameLot(a: Pick<TopUpLine, "material" | "batchNumber">, b: Pick<TopUpLine, "material" | "batchNumber">): boolean {
  const batch = a.batchNumber.trim().toUpperCase();
  return batch !== "" && a.material.id === b.material.id && batch === b.batchNumber.trim().toUpperCase();
}

const calendar = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
export const showDay = (date: Date | null) => date ? calendar.format(date) : "–";
