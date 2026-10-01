import type { DomainEntitiesProductsCreateProductPacking } from "@/shared/api/generated/products";
import type { PackingStyleFormValues, SavedPackingStyle } from "../schemas/packing-style-schema";
import { unitLabel } from "./product-form";

/** A packing style being edited. `key` identifies the row here; `id` is set once the backend has saved it. */
export interface PackingStyle extends PackingStyleFormValues { key: string; id: string | null }

export function fromSaved(styles: readonly SavedPackingStyle[]): PackingStyle[] {
  return styles.map((style) => ({
    key: style.id, id: style.id, name: style.name, description: style.description, isDefault: style.isDefault,
    basePackingUom: { value: style.basePackingUoM?.id ?? "", label: style.basePackingUoM ? unitLabel(style.basePackingUoM) : "" },
    basePackingQuantity: style.basePackingQuantity ?? 0, expectedYield: style.expectedYield, packPerShipper: style.packPerShipper ?? 0,
    units: [...style.packingLists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((unit) => ({ uom: { value: unit.uom?.id ?? "", label: unit.uom ? unitLabel(unit.uom) : "" }, quantity: unit.quantity ?? 0 })),
  }));
}

/**
 * Exactly one style is the default whenever there are any. Making `preferKey` the default clears
 * the others; if none is marked (the default was removed or unticked), the first becomes it.
 */
export function withOneDefault(styles: readonly PackingStyle[], preferKey?: string): PackingStyle[] {
  const chosen = styles.find((style) => style.key === preferKey && style.isDefault) ?? styles.find((style) => style.isDefault) ?? styles[0];
  return styles.map((style) => ({ ...style, isDefault: style.key === chosen?.key }));
}

export function addStyle(styles: readonly PackingStyle[], values: PackingStyleFormValues, key: string): PackingStyle[] {
  return withOneDefault([...styles, { ...values, key, id: null }], key);
}

export function updateStyle(styles: readonly PackingStyle[], key: string, values: PackingStyleFormValues): PackingStyle[] {
  return withOneDefault(styles.map((style) => style.key === key ? { ...style, ...values } : style), key);
}

export function removeStyle(styles: readonly PackingStyle[], key: string): PackingStyle[] {
  return withOneDefault(styles.filter((style) => style.key !== key));
}

/** A label already used by another style. The backend matches unsaved styles by label, so labels must differ. */
export function isDuplicateName(styles: readonly PackingStyle[], name: string, exceptKey: string | null): boolean {
  const wanted = name.trim().toLowerCase();
  return styles.some((style) => style.key !== exceptKey && style.name.trim().toLowerCase() === wanted);
}

/** How many base packs one full batch fills, rounded to a whole pack. Null when it cannot be worked out. */
export function suggestedYield(fullBatchSize: number | null | undefined, basePackingQuantity: number | null | undefined): number | null {
  if (!fullBatchSize || !basePackingQuantity || basePackingQuantity <= 0) return null;
  const value = Math.round(fullBatchSize / basePackingQuantity);
  return Number.isFinite(value) ? value : null;
}

/**
 * The save request. A saved style keeps its ID, so renaming it updates it; without the ID the
 * backend would treat the new label as a new style and try to delete the old one.
 */
export function toPackingRequest(styles: readonly PackingStyle[]): DomainEntitiesProductsCreateProductPacking[] {
  return styles.map((style) => ({
    ...(style.id ? { id: style.id } : {}),
    name: style.name.trim(),
    description: style.description?.trim() || null,
    basePackingUomId: style.basePackingUom.value,
    basePackingQuantity: style.basePackingQuantity,
    expectedYield: style.expectedYield ?? 0,
    packPerShipper: style.packPerShipper,
    isDefault: style.isDefault,
    packingLists: style.units.map((unit, index) => ({ uomId: unit.uom.value, quantity: unit.quantity, order: index + 1 })),
  }));
}
