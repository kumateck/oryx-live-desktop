import type {
  DomainEntitiesProductionSchedulesPackingCreateFinalPacking as FinalPackingRequest,
  DomainEntitiesProductionSchedulesPackingCreateFinalPackingMaterial as MaterialRequest,
} from "@/shared/api/generated/production";
import { fromSmallestUnit, isVolumeUnit, relatedUnits, toSmallestUnit } from "@/shared/units/quantity";

/** Above this share of loss or gain, the person recording it must say why. */
export const varianceLimitPercent = 2;

export type PackCategory = "syrup" | "tube" | "capsules" | "tablet" | "dry powder" | "sachet";
const categories: readonly PackCategory[] = ["syrup", "tube", "capsules", "tablet", "dry powder", "sachet"];
/** The kind of pack, taken from the name of the packing style's unit, which is how the product is set up. */
export function packCategory(unitName: string | null | undefined): PackCategory | null {
  const name = unitName?.trim().toLowerCase();
  return categories.find((category) => category === name) ?? null;
}

const counted: Record<PackCategory, string> = { syrup: "bottles", tube: "tubes", capsules: "capsules", tablet: "tablets", "dry powder": "bottles", sachet: "sachets" };
const received: Partial<Record<PackCategory, string>> = { tube: "Total weight of gel received for filling", capsules: "Total weight of capsules received for packaging",
  tablet: "Total weight of tablets received for packaging", "dry powder": "Total weight of granules for filling", sachet: "Total weight of sachets received for packaging" };
const average: Partial<Record<PackCategory, string>> = { tube: "Average weight of filled tube", capsules: "Average weight of capsule", tablet: "Average weight of tablet",
  "dry powder": "Average weight of filled bottle", sachet: "Average weight of sachet" };

/** The words and units the yield section uses for a kind of pack and the unit the product is measured in. */
export function yieldTerms(category: PackCategory | null, productUnit: string | null) {
  const volume = isVolumeUnit(productUnit);
  return {
    countUnit: category ? counted[category] : "packs",
    receivedLabel: (category && received[category]) ?? (volume ? "Total volume received" : "Total weight received"), receivedUnit: volume ? "L" : "kg",
    averageLabel: (category && average[category]) ?? "Average volume filled per bottle", averageUnit: volume ? "ml" : "mg",
  };
}

export interface YieldInputs { received: number | null; averageFilled: number | null; actualPacked: number | null; qcSample: number | null; retained: number | null; stability: number | null }
export interface YieldSource { category: PackCategory | null; receivedUnit: string; packingExpectedYield: number; packsPerShipper: number | null }

const amount = (value: number | null) => value !== null && Number.isFinite(value) ? value : 0;

/**
 * Everything the yield and quantity-packed sections work out from what was entered. Nothing here
 * is typed in: expected packs, what is left after samples, the gain or loss, and how it packs into shippers.
 */
export function yieldFigures(inputs: YieldInputs, source: YieldSource) {
  // For anything but syrup, the expected number of packs is what the received bulk makes at the average fill.
  const fromBulk = source.category !== "syrup" && amount(inputs.received) > 0 && amount(inputs.averageFilled) > 0
    ? Math.round(toSmallestUnit(amount(inputs.received), source.receivedUnit) / amount(inputs.averageFilled)) : null;
  const expected = fromBulk ?? source.packingExpectedYield;
  const samples = amount(inputs.qcSample) + amount(inputs.retained) + amount(inputs.stability);
  const afterSamples = amount(inputs.actualPacked) - samples;
  const gainOrLoss = afterSamples - expected;
  const percent = expected > 0 && amount(inputs.actualPacked) > 0 ? (gainOrLoss / expected) * 100 : null;
  const perShipper = source.packsPerShipper;
  const fullShippers = perShipper && afterSamples > 0 ? Math.floor(afterSamples / perShipper) : 0;
  const leftOver = perShipper && afterSamples > 0 ? afterSamples % perShipper : 0;
  return { expected, samples, afterSamples, gainOrLoss, percent, fullShippers, leftOver, totalPacked: perShipper ? perShipper * fullShippers + leftOver : 0,
    needsReason: percent !== null && Math.abs(percent) >= varianceLimitPercent };
}
export type YieldFigures = ReturnType<typeof yieldFigures>;

/** A packaging material issued to the batch, to be accounted for. Quantities are stored ones; `displayUnit` is what people enter and read. */
export interface PackingMaterial { materialId: string; name: string; code: string; displayUnit: string; received: number; delivered: number; total: number }

export function packingMaterials(items: readonly { materialId: string; name: string; code: string; unit: string | null; quantity: number }[],
  extras: readonly { materialId: string | null; quantity: number }[]): PackingMaterial[] {
  return items.map((item) => {
    const delivered = extras.filter((extra) => extra.materialId === item.materialId).reduce((sum, extra) => sum + extra.quantity, 0);
    return { materialId: item.materialId, name: item.name, code: item.code, displayUnit: relatedUnits(item.unit).at(-1) ?? item.unit ?? "", received: item.quantity, delivered, total: item.quantity + delivered };
  });
}

/** What was done with a material, entered in its display unit. */
export interface MaterialEntry { packed: number | null; rejected: number | null; sampled: number | null; reason: string }
export const emptyEntry: MaterialEntry = { packed: null, rejected: null, sampled: null, reason: "" };

export function materialFigures(material: PackingMaterial, entry: MaterialEntry) {
  const total = fromSmallestUnit(material.total, material.displayUnit);
  const used = amount(entry.packed) + amount(entry.rejected) + amount(entry.sampled);
  // What is not packed, rejected, or sampled goes back to the warehouse.
  const returned = Math.max(0, Number((total - used).toPrecision(12)));
  const percentLoss = total > 0 ? (amount(entry.rejected) / total) * 100 : 0;
  const needsReason = percentLoss >= varianceLimitPercent;
  const problem = !(amount(entry.packed) > 0) ? "Enter the quantity packed"
    : used > total ? "Packed, rejected, and sampled add up to more than was received"
      : needsReason && !entry.reason.trim() ? `Give the reason: the loss is at or above ${varianceLimitPercent}%` : null;
  return { total, returned, percentLoss, needsReason, problem };
}

export function materialRequests(materials: readonly PackingMaterial[], entries: Readonly<Record<string, MaterialEntry>>): MaterialRequest[] {
  return materials.map((material) => {
    const entry = entries[material.materialId] ?? emptyEntry;
    const figures = materialFigures(material, entry);
    const stored = (value: number | null) => toSmallestUnit(amount(value), material.displayUnit);
    return {
      materialId: material.materialId, receivedQuantity: material.received, subsequentDeliveredQuantity: material.delivered, totalReceivedQuantity: material.total,
      totalAccountedForQuantity: material.total, packedQuantity: stored(entry.packed), rejectedQuantity: stored(entry.rejected), sampledQuantity: stored(entry.sampled),
      returnedQuantity: toSmallestUnit(figures.returned, material.displayUnit), percentageLoss: Number(figures.percentLoss.toFixed(4)),
      percentageVarianceDescription: figures.needsReason ? entry.reason.trim() : "",
    };
  });
}

/** What goes back to the warehouse: every material with something left over. */
export function returnedMaterials(materials: readonly PackingMaterial[], entries: Readonly<Record<string, MaterialEntry>>, unitIds: Readonly<Record<string, string>>) {
  return materials.flatMap((material) => {
    const returned = materialFigures(material, entries[material.materialId] ?? emptyEntry).returned;
    const uoMId = unitIds[material.materialId];
    return returned > 0 && uoMId ? [{ materialId: material.materialId, quantity: toSmallestUnit(returned, material.displayUnit), uoMId }] : [];
  });
}

export function finalPackingRequest(input: { batchId: string; stepId: string; packingId: string; batchSize: number; inputs: YieldInputs; figures: YieldFigures; packsPerShipper: number;
  reason: string; materials: MaterialRequest[] }): FinalPackingRequest {
  const { inputs, figures } = input;
  return {
    productionScheduleProductId: input.batchId, productionActivityStepId: input.stepId, productPackingId: input.packingId, materials: input.materials,
    batchSize: input.batchSize, totalWeightReceived: amount(inputs.received), averageVolumeFilledPerBottle: amount(inputs.averageFilled),
    yieldTotalQuantityPacked: amount(inputs.actualPacked), qualityControlAnalyticalSample: amount(inputs.qcSample), retainedSamples: amount(inputs.retained), stabilitySamples: amount(inputs.stability),
    totalNumberOfBottles: figures.afterSamples, totalGainOrLoss: figures.gainOrLoss,
    numberOfBottlesPerShipper: input.packsPerShipper, nUmberOfFullShipperPacked: figures.fullShippers, leftOver: figures.leftOver, totalQuantityPacked: figures.totalPacked,
    percentageVarianceDescription: figures.needsReason ? input.reason.trim() : "",
  };
}
