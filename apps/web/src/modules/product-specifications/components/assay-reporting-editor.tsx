import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { assayReportingKeys, assayRuleFormSchema, replaceAssayRule, type AssayConfiguration, type AssayOutputRow, type AssayRuleForm } from "../lib/assay-reporting";
import { assayReportingApi } from "../api/assay-reporting-api";
import { audit } from "../lib/product-specifications";

const fields = [
  { type: InputTypes.SWITCH, name: "enabled", label: "Report this output as % w/v", className: "md:col-span-2",
    description: "Enable only when this assay output is a percentage of labelled strength and its COA specification requires % w/v." },
  { type: InputTypes.NUMBER, name: "nominalConcentration", label: "Nominal concentration (% w/v)", min: 0, required: true,
    description: "For example, 120 mg/5 mL = 2.4; 125 mg/5 mL = 2.5." },
  { type: InputTypes.NUMBER, name: "decimalPlaces", label: "COA decimal places", min: 0, max: 8, step: 1, required: true },
  { type: InputTypes.NUMBER, name: "minimum", label: "Specification lower limit (% w/v)", min: 0, required: true },
  { type: InputTypes.NUMBER, name: "maximum", label: "Specification upper limit (% w/v)", min: 0, required: true },
  { type: InputTypes.TEXTAREA, name: "reason", label: "Reason for change", required: true, rows: 3, className: "md:col-span-2" },
] as const satisfies readonly WizardField<AssayRuleForm>[];

export function AssayReportingEditor({ configuration, row, onSaved, onClose }: {
  configuration: AssayConfiguration; row: AssayOutputRow; onSaved: () => void; onClose: () => void;
}) {
  const [save, mutation] = assayReportingApi.useSaveProductAssayReportingMutation();
  const permission = usePermissionAction(assayReportingKeys.edit);
  const [message, setMessage] = useState("");
  const rule = row.rule;
  const form = useForm<AssayRuleForm>({ resolver: zodResolver(assayRuleFormSchema), defaultValues: { enabled: Boolean(rule),
    nominalConcentration: rule?.nominalConcentration ?? Number.NaN, minimum: rule?.minimum ?? Number.NaN, maximum: rule?.maximum ?? Number.NaN,
    decimalPlaces: rule?.decimalPlaces ?? 4, reason: "" } });
  const submit = form.handleSubmit(async values => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (values.enabled && row.unavailable) { setMessage(row.unavailable); return; }
    setMessage("");
    const result = await save({ ...audit, id: configuration.specificationId, domainEntitiesProductSpecificationsSaveAssayReportingRequest: {
      expectedToken: configuration.token, reason: values.reason, rules: replaceAssayRule(configuration, row, values),
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onSaved();
  });
  return <FormDialog title="COA assay reporting" description={`${configuration.productName} · ${row.label}`} form={form} fields={fields}
    allowed busy={mutation.isLoading} message={message} submitLabel="Save reporting settings" wide
    onSubmit={event => { void submit(event); }} onClose={onClose}
    footnote={<div className="space-y-2 text-sm"><div><span className="font-medium">Current specification: </span><RichTextView html={row.specification || "–"} /></div>
      <p className="text-muted-foreground">The COA result is selected assay result ÷ 100 × nominal concentration. Each selected output uses its own limits before display rounding. Saving requires this product specification to be approved again.</p>
      {row.unavailable ? <p role="alert" className="text-destructive">{row.unavailable}</p> : null}</div>} />;
}
