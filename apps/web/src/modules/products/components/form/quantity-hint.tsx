import { useWatch, type Control } from "react-hook-form";
import { toLargestUnit } from "@/shared/units/quantity";
import type { ProductFormValues } from "../../schemas/product-form-schema";

/**
 * Restates the quantities in a readable unit while they are typed. They are entered in the base
 * unit, so a batch of 1,500 L in millilitres is typed as 1500000; this shows what that amounts to.
 */
export function QuantityHint({ control, unitSymbol }: { control: Control<ProductFormValues>; unitSymbol: (id: string | undefined) => string | null }) {
  const [unit, composition, batch] = useWatch({ control, name: ["baseUom", "baseQuantity", "fullBatchSize"] });
  const symbol = unitSymbol(unit?.value) ?? /\(([^)]+)\)\s*$/.exec(unit?.label ?? "")?.[1] ?? null;
  if (!symbol) return <p className="text-xs text-muted-foreground">Choose the base unit first. Quantities are entered in that unit.</p>;
  const compositionText = toLargestUnit(typeof composition === "number" ? composition : null, symbol)?.text;
  const batchText = toLargestUnit(typeof batch === "number" ? batch : null, symbol)?.text;
  const units = typeof composition === "number" && typeof batch === "number" && composition > 0 ? batch / composition : null;
  return <p role="status" className="text-xs text-muted-foreground">
    Enter quantities in {symbol}.
    {compositionText ? ` Composition unit: ${compositionText}.` : ""}
    {batchText ? ` Full batch: ${batchText}.` : ""}
    {units !== null && Number.isFinite(units) ? ` That is ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(units)} composition units per batch.` : ""}
  </p>;
}
