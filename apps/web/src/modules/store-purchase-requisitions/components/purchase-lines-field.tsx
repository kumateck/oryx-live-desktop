import { useController, useWatch } from "react-hook-form";
import type { CustomFieldProps } from "@/shared/forms/form-wizard";
import { InventoryLinesField } from "@/shared/inventory/inventory-lines-field";
import { purchaseRequisitionAudit } from "../lib/purchase-requisitions";
import type { PurchaseFormValues } from "../schemas/purchase-form";

const rules = { fractions: true, requireUnit: true };
export default function PurchaseLinesField({ id, invalid, describedBy, control, disabled }: CustomFieldProps<PurchaseFormValues>) {
  const { field, formState } = useController({ control, name: "lines" });
  const store = useWatch({ control, name: "store" });
  return <InventoryLinesField id={id} invalid={invalid} describedBy={describedBy} lines={field.value} onChange={field.onChange} store={store} audit={purchaseRequisitionAudit}
    rules={rules} showErrors={formState.isSubmitted} disabled={disabled || formState.isSubmitting} />;
}
