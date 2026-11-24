import { useEffect, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { toLargestUnit } from "@/shared/units/quantity";
import { bomAudit } from "../../hooks/use-bom";
import { useMaterialUnit } from "../../hooks/use-material-unit";
import type { MaterialUnit } from "../../lib/material-unit";
import { batchQuantity } from "../../lib/product-detail";
import type { BomItemFormValues } from "../../schemas/bom-schema";
import { MaterialQuantityFields } from "../material-quantity-fields";
import { linkedBomQuantity, type BomSubstitute } from "../../lib/bom";

/**
 * The quantity of one substitute that replaces the line's material, in the substitute's own stock unit (or mg when the
 * line converts with density). It is entered separately because a substitute can differ in strength or water content.
 */
export function SubstituteQuantity({ form, substitute, known, density, compositionSize, batchSize, onUnit, saved }: {
  form: UseFormReturn<BomItemFormValues>;
  substitute: { value: string; label: string };
  known: MaterialUnit | null;
  density: boolean;
  compositionSize: number | null;
  batchSize: number | null;
  onUnit: (materialId: string, unit: MaterialUnit | null) => void;
  saved: BomSubstitute | null;
}) {
  const linked = useMaterialUnit(density ? undefined : substitute.value, known, bomAudit);
  const unit: MaterialUnit | null = density ? { id: "mg", symbol: "mg" } : linked.unit;
  const { value } = substitute;
  const linkedId = linked.unit?.id;
  const linkedSymbol = linked.unit?.symbol;
  const source = useRef(saved);
  useEffect(() => {
    if (!source.current || !linkedId || !linkedSymbol || density) return;
    const previous = source.current;
    source.current = null;
    const converted = linkedBomQuantity(previous.baseQuantity, previous.unit, { id: linkedId, symbol: linkedSymbol });
    form.setValue(`substituteQuantities.${value}`, converted ?? Number.NaN);
    if (converted === null) form.setError(`substituteQuantities.${value}`, { message: `Enter this substitute's quantity in its department unit (${linkedSymbol}). The saved unit cannot be converted.` });
  }, [density, form, linkedId, linkedSymbol, value]);
  useEffect(() => { onUnit(value, density || !linkedId || !linkedSymbol ? null : { id: linkedId, symbol: linkedSymbol }); }, [onUnit, value, density, linkedId, linkedSymbol]);
  const quantity = useWatch({ control: form.control, name: `substituteQuantities.${value}` });
  const perBatch = unit ? toLargestUnit(batchQuantity(typeof quantity === "number" && Number.isFinite(quantity) ? quantity : null, compositionSize, batchSize),
    unit.symbol, "calculated") : null;
  return <fieldset className="min-w-0 space-y-2 rounded-md border p-3">
    <legend className="px-1 text-sm font-medium">{substitute.label}</legend>
    {unit ? <MaterialQuantityFields key={unit.symbol} form={form} unit={unit}
      fields={[{ name: `substituteQuantities.${value}`, label: "Unit quantity", required: true,
        description: "How much of this substitute replaces the material in one composition unit." }]} />
      : linked.status === "loading" ? <Skeleton className="h-14" />
      : <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
        {linked.status === "error" ? "The substitute's unit could not be loaded." : "No unit is set on the substitute's department material linkage."}
        <Button type="button" size="sm" variant="outline" onClick={linked.retry}>Retry unit</Button>
      </p>}
    <p className="text-xs text-muted-foreground">Per full batch: {perBatch?.text ?? "–"}</p>
  </fieldset>;
}
