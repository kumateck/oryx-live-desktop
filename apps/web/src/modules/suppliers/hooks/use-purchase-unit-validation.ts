import { useState } from "react";
import { useLazyMaterialPurchaseUnitsQuery } from "@/shared/reference-data/material-purchase-units";
import { supplierAudit } from "../lib/supplier-access";
import { purchaseUnitOptions } from "@/shared/procurement/purchase-units";
import type { SupplierFormValues } from "../schemas/supplier-form-schema";

/** Re-read each material before saving; never trust a stale or manually supplied unit choice. */
export function usePurchaseUnitValidation() {
  const [load] = useLazyMaterialPurchaseUnitsQuery();
  const [validating, setValidating] = useState(false);
  const validate = async (associations: SupplierFormValues["associations"]) => {
    setValidating(true);
    try {
      return await Promise.all(associations.map(async (row, index) => {
        try {
          const materialUnits = await load({ ...supplierAudit, materialId: row.material?.value ?? "" }).unwrap();
          const options = purchaseUnitOptions(materialUnits);
          return options.some((option) => option.value === row.uom?.value) ? null
            : { index, message: "Choose a purchase unit compatible with this material’s linked unit." };
        } catch {
          return { index, message: "The material’s unit could not be verified. Retry before saving." };
        }
      }));
    } finally { setValidating(false); }
  };
  return { validate, validating };
}
