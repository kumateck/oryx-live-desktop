import { z } from "zod";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { relatedUnits } from "@/shared/units/quantity";

const unit = z.object({ id: z.string().nullish(), name: z.string().nullish(), symbol: z.string().nullish() });
const response = z.union([unit, z.array(unit)]).nullish();
export type MaterialPurchaseUnit = z.infer<typeof unit>;

export function readMaterialPurchaseUnits(value: Parameters<typeof response.safeParse>[0]): MaterialPurchaseUnit[] {
  const result = response.safeParse(value);
  if (!result.success || !result.data) return [];
  return Array.isArray(result.data) ? result.data : [result.data];
}

export function purchaseUnitSymbol(value: string | null | undefined): string {
  const symbol = value?.trim() ?? "";
  return relatedUnits(symbol).find((unit) => unit.toLowerCase() === symbol.toLowerCase()) ?? symbol;
}

/** All linked departments contribute their families; symbols are the stored values. */
export function purchaseUnitOptions(materialUnits: readonly MaterialPurchaseUnit[]): SelectOption[] {
  const symbols = new Map<string, string>();
  for (const unit of materialUnits) for (const symbol of relatedUnits(unit.symbol)) {
    if (!symbols.has(symbol.toLowerCase())) symbols.set(symbol.toLowerCase(), symbol);
  }
  const order = [...relatedUnits("mg"), ...relatedUnits("ml")];
  const rank = (symbol: string) => { const index = order.indexOf(symbol); return index < 0 ? order.length : index; };
  return [...symbols.values()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((symbol) => ({ value: symbol, label: symbol }));
}

/** A retained saved choice stays visible even during loading or lookup failure. */
export function purchaseUnitDisplayOptions(options: readonly SelectOption[], selected: SelectOption | null): readonly SelectOption[] {
  return selected && !options.some((option) => option.value === selected.value)
    ? [{ ...selected, disabled: true }, ...options] : options;
}
