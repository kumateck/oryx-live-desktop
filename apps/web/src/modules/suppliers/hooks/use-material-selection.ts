import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { DomainEntitiesBaseUnitOfMeasureDto as UnitOfMeasureDto } from "@/shared/api/generated/materials";
import { purchaseUnitSymbol } from "@/shared/procurement/purchase-units";
import type { SupplierFormValues } from "../schemas/supplier-form-schema";

/** Reset dependent choices on material change; keep saved symbols and default a single linked unit. */
export function useMaterialSelection(form: UseFormReturn<SupplierFormValues>, index: number,
  kind: string | undefined, material: string | undefined, units: readonly UnitOfMeasureDto[]) {
  const previous = useRef({ kind, material });
  useEffect(() => {
    if (previous.current.kind !== kind) form.setValue(`associations.${index}.material`, null, { shouldDirty: true });
    else if (previous.current.material !== material) {
      form.setValue(`associations.${index}.uom`, null, { shouldDirty: true });
      form.setValue(`associations.${index}.pendingUnit`, null);
      form.setValue(`associations.${index}.defaultManufacturer`, null, { shouldDirty: true });
      form.setValue(`associations.${index}.otherManufacturers`, [], { shouldDirty: true });
    }
    previous.current = { kind, material };
    const symbols = [...new Set(units.map((unit) => purchaseUnitSymbol(unit.symbol)).filter(Boolean))];
    const symbol = symbols[0];
    if (material && symbols.length === 1 && symbol && !form.getValues(`associations.${index}.uom`))
      form.setValue(`associations.${index}.uom`, { value: symbol, label: symbol }, { shouldDirty: true });
  }, [kind, material, units, form, index]);
}
