import { useController, useWatch } from "react-hook-form";
import type { CustomFieldProps } from "@/shared/forms/form-wizard";
import { InventoryLinesField } from "@/shared/inventory/inventory-lines-field";
import { stockRequisitionAudit } from "../lib/stock-requisitions";
import type { RequisitionFormValues } from "../schemas/requisition-form";

const rules = { capToStock: true };
export default function RequisitionLinesField({ id, invalid, describedBy, control, disabled }: CustomFieldProps<RequisitionFormValues>) {
  const { field, formState } = useController({ control, name: "lines" });
  const store = useWatch({ control, name: "store" });
  return <InventoryLinesField id={id} invalid={invalid} describedBy={describedBy} lines={field.value} onChange={field.onChange} store={store} audit={stockRequisitionAudit}
    rules={rules} showErrors={formState.isSubmitted} disabled={disabled || formState.isSubmitting} />;
}
