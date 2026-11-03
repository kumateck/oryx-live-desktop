import type { UseFormReturn } from "react-hook-form";
import type { PackagingUnit } from "../../lib/packaging";
import type { PackagingItemFormValues } from "../../schemas/packaging-schema";
import { MaterialQuantityFields, type MaterialQuantityField } from "../material-quantity-fields";

const fields: readonly MaterialQuantityField<PackagingItemFormValues>[] = [
  { name: "prescribedQuantity", label: "Prescribed quantity", required: true },
  { name: "packingExcessMargin", label: "Packing allowance", description: "Extra issued to cover losses during packing." },
];

export function PackagingQuantityFields({ form, unit }: { form: UseFormReturn<PackagingItemFormValues>; unit: PackagingUnit }) {
  return <MaterialQuantityFields form={form} unit={unit} fields={fields} description="Applies to both prescribed quantity and packing allowance." />;
}
