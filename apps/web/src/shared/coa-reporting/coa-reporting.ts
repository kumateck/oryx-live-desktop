import { z } from "zod";

/** View and override which tests of a specification's template print on the certificate, per specification kind. */
export const coaReportingKeys = {
  product: { view: "CanViewProductCoaReportedTests", edit: "CanEditProductCoaReportedTests" },
  raw: { view: "CanViewRawMaterialCoaReportedTests", edit: "CanEditRawMaterialCoaReportedTests" },
  packaging: { view: "CanViewPackagingMaterialCoaReportedTests", edit: "CanEditPackagingMaterialCoaReportedTests" },
} as const;
export type CoaReportingKeys = { readonly view: string; readonly edit: string };

/** AnalysisType on the backend. Only the microbial template has a screen so far; chemical uses the same endpoint. */
export const AnalysisKind = { Chemical: 0, Microbial: 1 } as const;
export type AnalysisKind = (typeof AnalysisKind)[keyof typeof AnalysisKind];

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
export const coaReportingSchema = z.object({
  formId: z.string().nullish().transform((value) => value ?? null),
  fields: z.array(z.object({
    formFieldId: z.string(), formSectionId: z.string(), sectionName: text, questionLabel: text,
    templateReportOnCoa: z.boolean(), override: z.boolean().nullish().transform((value) => value ?? null), reportOnCoa: z.boolean(),
  })).nullish().transform((value) => value ?? []),
  reason: text, savedAt: text,
});
export type CoaReporting = z.infer<typeof coaReportingSchema>;
export type CoaReportingField = CoaReporting["fields"][number];

/** Template fields grouped by their section, in template order. */
export function sectionsOf(fields: readonly CoaReportingField[]): { id: string; name: string; fields: CoaReportingField[] }[] {
  const sections: { id: string; name: string; fields: CoaReportingField[] }[] = [];
  for (const field of fields) {
    const section = sections.find((item) => item.id === field.formSectionId);
    if (section) section.fields.push(field);
    else sections.push({ id: field.formSectionId, name: field.sectionName ?? "Test", fields: [field] });
  }
  return sections;
}

/** Only the choices that differ from the template are overrides; a field matching the template follows it. */
export function overridesFor(fields: readonly CoaReportingField[], choices: Readonly<Record<string, boolean>>) {
  return fields.flatMap((field) => {
    const chosen = choices[field.formFieldId] ?? field.reportOnCoa;
    return chosen === field.templateReportOnCoa ? [] : [{ formFieldId: field.formFieldId, reportOnCoa: chosen }];
  });
}
