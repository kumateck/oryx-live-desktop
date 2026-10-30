import type {
  DomainEntitiesProductionSchedulesPackingCreateFinalPacking as FinalPackingRequest,
  DomainEntitiesProductionSchedulesPackingCreateFinalPackingMaterial as MaterialRequest,
} from "@/shared/api/generated/production";
import { shipperSplit, toPacks } from "@/shared/packing/packs";
import { fromSmallestUnit, isVolumeUnit, relatedUnits, toLargestUnit, toSmallestUnit } from "@/shared/units/quantity";

/** Above this share of loss or gain, the person recording it must say why. */
export const varianceLimitPercent = 2;

export type PackCategory = "syrup" | "tube" | "capsules" | "tablet" | "dry powder" | "sachet";
const categories: readonly PackCategory[] = ["syrup", "tube", "capsules", "tablet", "dry powder", "sachet"];
/** Prefer declared product/style categories. Legacy liquid styles may use a generic bottle unit. */
export function packCategory(unitName: string | null | undefined, product?: { categoryName: string | null; unit: string | null }): PackCategory | null {
  const declared = [product?.categoryName, unitName].map((name) => name?.trim().toLowerCase());
  return declared.flatMap((name) => categories.filter((category) => category === name))[0] ?? (isVolumeUnit(product?.unit) ? "syrup" : null);
}

const counted: Record<PackCategory, string> = { syrup: "bottles", tube: "tubes", capsules: "capsules", tablet: "tablets", "dry powder": "bottles", sachet: "sachets" };
const received: Partial<Record<PackCategory, string>> = { tube: "Total weight of gel received for filling", capsules: "Total weight of capsules received for packaging",
  tablet: "Total weight of tablets received for packaging", "dry powder": "Total weight of granules for filling", sachet: "Total weight of sachets received for packaging" };
const average: Partial<Record<PackCategory, string>> = { tube: "Average weight of filled tube", capsules: "Average weight of capsule", tablet: "Average weight of tablet",
  "dry powder": "Average weight of filled bottle", sachet: "Average weight of sachet" };

/** The words and units the yield section uses for a kind of pack and the unit the product is measured in. */
export function yieldTerms(category: PackCategory | null, productUnit: string | null) {
  const volume = category === "syrup" || (category === null && isVolumeUnit(productUnit));
  return {
    countUnit: category ? counted[category] : "packs",
    requiresReceived: category !== "syrup",
    receivedLabel: (category && received[category]) ?? (volume ? "Total volume received" : "Total weight received"), receivedUnit: volume ? "L" : "kg",
    averageLabel: (category && average[category]) ?? "Average volume filled per bottle", averageUnit: volume ? "ml" : "mg",
  };
}

export interface YieldInputs { received: number | null; averageFilled: number | null; actualPacked: number | null; qcSample: number | null; retained: number | null; stability: number | null }
export interface YieldSource {
  category: PackCategory | null; receivedUnit: string; packingExpectedYield: number; packsPerShipper: number | null;
  /** Base units (tablets, bottles…) in one pack, from the packing style's units. Missing means one base unit is one pack. */
  baseUnitsPerPack?: number | null;
}

const amount = (value: number | null) => value !== null && Number.isFinite(value) ? value : 0;

/**
 * Everything the yield and quantity-packed sections work out from what was entered. Nothing here
 * is typed in: expected packs, what is left after samples, the gain or loss, and how it packs into shippers.
 * Counting is in base units (tablets, bottles…); what is left after samples becomes whole packs, then full
 * shippers and loose packs. Base units that do not fill a pack are `leftoverUnits`.
 */
export function yieldFigures(inputs: YieldInputs, source: YieldSource) {
  // Syrup uses its preloaded packing-style yield. Other categories retain weight-based calculations.
  const bulk = toSmallestUnit(amount(inputs.received), source.receivedUnit);
  const expected = source.category === "syrup" ? amount(source.packingExpectedYield)
    : bulk > 0 && amount(inputs.averageFilled) > 0 ? Math.round(bulk / amount(inputs.averageFilled)) : 0;
  const samples = amount(inputs.qcSample) + amount(inputs.retained) + amount(inputs.stability);
  const afterSamples = amount(inputs.actualPacked) - samples;
  // Samples remain accounted product. Only warehouse availability is reduced by sampling.
  const gainOrLoss = amount(inputs.actualPacked) - expected;
  const percent = expected > 0 && amount(inputs.actualPacked) > 0 ? (gainOrLoss / expected) * 100 : null;
  const perShipper = source.packsPerShipper;
  const perPack = source.baseUnitsPerPack ?? 1;
  const whole = perShipper && afterSamples > 0 ? toPacks(afterSamples, perPack) : null;
  const split = shipperSplit(whole?.packs ?? 0, perShipper);
  return { expected, samples, afterSamples, gainOrLoss, percent, perPack,
    fullShippers: whole ? split.shippers : 0, leftOver: whole ? split.loose : 0, totalPacked: whole?.packs ?? 0, leftoverUnits: whole?.leftover ?? 0,
    // The backend holds finished goods as yield: the base units in the whole packs that can go to the store.
    transferableYield: whole ? whole.packs * perPack : 0,
    needsReason: percent !== null && Math.abs(percent) >= varianceLimitPercent };
}
export type YieldFigures = ReturnType<typeof yieldFigures>;

/** A packaging material issued to the batch, to be accounted for. Quantities are stored ones; `displayUnit` is what people enter and read. */
export interface PackingMaterial { materialId: string; name: string; code: string; displayUnit: string; received: number; delivered: number; total: number }

export function packingMaterials(items: readonly { materialId: string; name: string; code: string; unit: string | null; quantity: number }[],
  extras: readonly { materialId: string | null; quantity: number }[]): PackingMaterial[] {
  const grouped = new Map<string, typeof items[number]>();
  for (const item of items) {
    const previous = grouped.get(item.materialId);
    grouped.set(item.materialId, previous ? { ...previous, quantity: previous.quantity + item.quantity } : item);
  }
  return [...grouped.values()].map((item) => {
    const delivered = extras.filter((extra) => extra.materialId === item.materialId).reduce((sum, extra) => sum + extra.quantity, 0);
    const total = item.quantity + delivered;
    // API amounts are in the family's smallest unit, even when its UoM symbol is kg or L.
    // Keep the entry unit stable for this baseline; never derive it from an edited remainder.
    const baseUnit = relatedUnits(item.unit)[0] ?? item.unit;
    const displayUnit = toLargestUnit(total, baseUnit)?.unit ?? item.unit ?? "";
    return { materialId: item.materialId, name: item.name, code: item.code, displayUnit, received: item.quantity, delivered, total };
  });
}

/** What was done with a material, entered in its display unit. */
export interface MaterialEntry { packed: number | null; rejected: number | null; sampled: number | null; reason: string }
export const emptyEntry: MaterialEntry = { packed: null, rejected: null, sampled: null, reason: "" };

export function materialFigures(material: PackingMaterial, entry: MaterialEntry) {
  const total = fromSmallestUnit(material.total, material.displayUnit);
  const used = Number((amount(entry.packed) + amount(entry.rejected) + amount(entry.sampled)).toPrecision(12));
  // What is not packed, rejected, or sampled goes back to the warehouse.
  const returned = Math.max(0, Number((total - used).toPrecision(12)));
  const percentLoss = total > 0 ? (amount(entry.rejected) / total) * 100 : 0;
  const needsReason = percentLoss >= varianceLimitPercent;
  const invalid = [entry.packed, entry.rejected, entry.sampled].some((value) => value !== null && (!Number.isFinite(value) || value < 0));
  const problem = invalid ? "Packed, rejected, and sampled must be finite, non-negative quantities"
    : !(amount(entry.packed) > 0) ? "Enter the quantity packed"
    : used > total ? "Packed, rejected, and sampled add up to more than was received"
      : needsReason && !entry.reason.trim() ? `Give the reason: the loss is at or above ${varianceLimitPercent}%` : null;
  return { total, returned, percentLoss, needsReason, problem };
}

/** Recheck the complete snapshot at the write boundary, independently of the form's UI. */
export function packingProblem(input: { category: PackCategory; inputs: YieldInputs; figures: YieldFigures; batchSize: number; packsPerShipper: number; reason: string;
  materials: readonly PackingMaterial[]; entries: Readonly<Record<string, MaterialEntry>>; unitIds: Readonly<Record<string, string>> }): string | null {
  const measurements = [input.batchSize, input.packsPerShipper, input.inputs.averageFilled];
  if (input.category !== "syrup") measurements.push(input.inputs.received);
  if (!measurements.every((value) => value !== null && Number.isFinite(value) && value > 0))
    return "Batch size, packs per shipper, average fill, and any required received quantity must be positive finite numbers.";
  if (!Number.isSafeInteger(input.packsPerShipper)) return "Packs per shipper must be a whole number.";
  const counts = [input.inputs.actualPacked, input.inputs.qcSample, input.inputs.retained, input.inputs.stability];
  if (!counts.every((value) => value !== null && Number.isSafeInteger(value) && value >= 0) || !(amount(input.inputs.actualPacked) > 0))
    return "Packed quantities and samples must be whole, non-negative counts, with at least one pack.";
  if (![input.figures.expected, input.figures.afterSamples, input.figures.totalPacked].every((value) => Number.isSafeInteger(value) && value > 0)
    || ![input.figures.percent, input.figures.gainOrLoss].every((value) => value !== null && Number.isFinite(value)))
    return "The yield must have a positive expected quantity and some packs left after samples.";
  if (input.figures.needsReason && !input.reason.trim()) return "Say why the yield is off by this much.";
  for (const material of input.materials) {
    if (![material.received, material.delivered, material.total].every((value) => Number.isFinite(value) && value >= 0)) return `${material.name}: the issued quantity is invalid.`;
    const figures = materialFigures(material, input.entries[material.materialId] ?? emptyEntry);
    if (figures.problem) return `${material.name}: ${figures.problem}`;
    if (figures.returned > 0 && !input.unitIds[material.materialId]) return `${material.name}: the unit of measure is missing, so leftovers cannot be returned.`;
  }
  return null;
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

export function finalPackingRequest(input: { category: PackCategory; batchId: string; stepId: string; packingId: string; batchSize: number; inputs: YieldInputs; figures: YieldFigures; packsPerShipper: number;
  reason: string; materials: MaterialRequest[] }): FinalPackingRequest {
  const { inputs, figures } = input;
  return {
    productionScheduleProductId: input.batchId, productionActivityStepId: input.stepId, productPackingId: input.packingId, materials: input.materials,
    // The legacy decimal property remains 0 for syrup: no received weight is measured on that form.
    batchSize: input.batchSize, totalWeightReceived: input.category === "syrup" ? 0 : amount(inputs.received), averageVolumeFilledPerBottle: amount(inputs.averageFilled),
    yieldTotalQuantityPacked: amount(inputs.actualPacked), qualityControlAnalyticalSample: amount(inputs.qcSample), retainedSamples: amount(inputs.retained), stabilitySamples: amount(inputs.stability),
    totalNumberOfBottles: figures.afterSamples, totalGainOrLoss: figures.gainOrLoss,
    numberOfBottlesPerShipper: input.packsPerShipper, nUmberOfFullShipperPacked: figures.fullShippers, leftOver: figures.leftOver, totalQuantityPacked: figures.transferableYield,
    percentageVarianceDescription: figures.needsReason ? input.reason.trim() : "",
  };
}
