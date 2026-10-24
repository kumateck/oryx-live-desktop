import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useBillingSheetCode } from "../hooks/use-billing-sheet-code";
import type { CreateSheetValues } from "../schemas/billing-schema";

const fields = [{ type: InputTypes.TEXT, name: "code", label: "Billing sheet number", required: true,
  placeholder: "Code will be generated" }] as const satisfies readonly WizardField<CreateSheetValues>[];

export function BillingSheetNumber() {
  const form = useFormContext<CreateSheetValues>();
  const code = useBillingSheetCode(form);
  return <div className="space-y-2">
    <FormWizard form={form} fields={fields} className="md:max-w-sm" />
    <div className="flex flex-wrap items-center gap-2">
      <p role={code.unavailable ? "alert" : "status"} className="text-xs text-muted-foreground">{code.busy ? "Generating the billing sheet number…"
        : code.unavailable ? "The billing sheet number could not be generated. Retry or enter it manually."
        : "Generated from the Billing Sheet code settings. You can change it."}</p>
      <Button type="button" size="xs" variant="ghost" disabled={code.busy} onClick={code.regenerate}>{code.unavailable ? "Retry number generation" : "Generate again"}</Button>
    </div>
  </div>;
}
