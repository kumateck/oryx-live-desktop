import { z } from "zod";

export { assayReportingKeys } from "./assay-reporting-keys";
export const assayRuleSchema = z.object({
  formFieldId: z.string(), resultKey: z.string(), definitionHash: z.string(), nominalConcentration: z.number(),
  minimum: z.number(), maximum: z.number(), decimalPlaces: z.number(),
});
const outputSchema = z.object({ key: z.string(), label: z.string(), canConvert: z.boolean().optional(), unavailableReason: z.string().nullish() });
const fieldSchema = z.object({ formFieldId: z.string(), testName: z.string().nullish(), label: z.string().nullish(), specification: z.string().nullish(),
  definitionHash: z.string(), outputs: z.array(outputSchema), unavailableReason: z.string().nullish() });
export const assayConfigurationSchema = z.object({ specificationId: z.string(), productId: z.string(), productName: z.string(), testStage: z.number(),
  specificationNumber: z.string(), token: z.string(), fields: z.array(fieldSchema), rules: z.array(assayRuleSchema) });
export type AssayConfiguration = z.infer<typeof assayConfigurationSchema>;
export type AssayRule = z.infer<typeof assayRuleSchema>;
export interface AssayOutputRow {
  key: string; fieldId: string; test: string; label: string; resultKey: string; definitionHash: string; specification: string;
  unavailable: string | null; rule: AssayRule | null;
}
export function assayRows(configuration: AssayConfiguration): AssayOutputRow[] {
  const current = configuration.fields.flatMap(field => (field.outputs.length ? field.outputs : [{ key: "", label: "Unavailable", unavailableReason: field.unavailableReason }]).map(output => ({
    key: `${field.formFieldId}:${output.key}`, fieldId: field.formFieldId, test: field.testName ?? "Assay", label: `${field.label ?? "Formula"} · ${output.label}`,
    resultKey: output.key, definitionHash: field.definitionHash, specification: field.specification ?? "", unavailable: output.unavailableReason ?? field.unavailableReason ?? null,
    rule: configuration.rules.find(rule => rule.formFieldId === field.formFieldId && rule.resultKey === output.key) ?? null,
  })));
  // Keep obsolete rules visible and removable; a changed template must not silently hide an enabled conversion.
  const missing = configuration.rules.filter(rule => !current.some(row => row.fieldId === rule.formFieldId && row.resultKey === rule.resultKey));
  return [...current, ...missing.map(rule => ({ key: `${rule.formFieldId}:${rule.resultKey}`, fieldId: rule.formFieldId, test: "Changed assay",
    label: rule.resultKey, resultKey: rule.resultKey, definitionHash: rule.definitionHash, specification: "", unavailable: "The selected output is no longer in this template. Disable this rule and review the current assay.", rule }))];
}

export const assayRuleFormSchema = z.object({
  enabled: z.boolean(), nominalConcentration: z.number().finite().positive().max(1_000_000),
  minimum: z.number().finite().min(0), maximum: z.number().finite().min(0).max(1_000_000),
  decimalPlaces: z.number().int().min(0).max(8), reason: z.string().trim().min(1, "Enter a reason for this reporting change.").max(2000),
}).superRefine((value, context) => {
  if (value.enabled && value.maximum < value.minimum) context.addIssue({ code: "custom", path: ["maximum"], message: "The upper limit must be at least the lower limit." });
});
export type AssayRuleForm = z.infer<typeof assayRuleFormSchema>;
export function replaceAssayRule(configuration: AssayConfiguration, row: AssayOutputRow, values: AssayRuleForm): AssayRule[] {
  const others = configuration.rules.filter(rule => rule.formFieldId !== row.fieldId || rule.resultKey !== row.resultKey);
  return values.enabled ? [...others, { formFieldId: row.fieldId, resultKey: row.resultKey, definitionHash: row.definitionHash,
    nominalConcentration: values.nominalConcentration, minimum: values.minimum, maximum: values.maximum, decimalPlaces: values.decimalPlaces }] : others;
}
