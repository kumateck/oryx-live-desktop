import { z } from "zod";
const text = z.string().nullish();
const value = z.object({ fieldKey: z.string(), rowIndex: z.number().int().nullish(), columnKey: text, value: text, enteredAt: text, enteredBy: z.object({ firstName: text, lastName: text }).nullish() });
export const worksheetFieldSchema = z.object({ id: z.string(), fieldKey: z.string().min(1), label: text, type: z.number().int().min(0).max(25), mode: z.number().int().min(0).max(2),
  unit: text, constantValue: text, columnDefinitions: text, optionsJson: text, readOnly: z.boolean(), requiredForSubmission: z.boolean(), values: z.array(value),
  referencedResult: z.object({ resolved: z.boolean(), value: text, message: text, resolvedFromInstanceId: text }).nullish(),
});
export const worksheetSchema = z.object({ id: z.string().min(1), testRequestSubjectId: z.string().min(1), worksheetTemplateCode: text, worksheetTemplateName: text,
  worksheetTemplateVersion: z.number().int(), analysisType: z.union([z.literal(0), z.literal(1)]), assignedToId: text, status: z.number().int().min(0).max(4), approved: z.boolean(),
  sections: z.array(z.object({ id: z.string(), name: text, order: z.number(), fields: z.array(worksheetFieldSchema) })),
  oosCases: z.array(z.object({ id: z.string(), fieldKey: z.string(), blocksRelease: z.boolean(), status: z.number(), dispositionComments: text })).optional(),
});
export type Worksheet = z.infer<typeof worksheetSchema>;
export type WorksheetField = z.infer<typeof worksheetFieldSchema>;
export const fillSchema = z.object({ cells: z.array(z.object({ fieldKey: z.string(), rowIndex: z.number().int().nullable(), columnKey: z.string().nullable(), value: z.string() })) });
export type WorksheetValues = z.infer<typeof fillSchema>;
export interface CellDefinition { fieldKey: string; rowIndex: number | null; columnKey: string | null; label: string; type: number; options: string[]; required: boolean }
const columnSchema = z.object({ key: text, columnKey: text, label: text, type: z.union([z.string(), z.number()]).nullish(), mode: z.union([z.string(), z.number()]).nullish(),
  fixedValues: z.array(z.json()).nullish(), rowHeader: z.boolean().optional(), options: z.array(z.string()).nullish(), unit: text,
});
const typeNames = ["ShortText", "LongText", "Number", "Date", "Time", "Select", "MultiSelect", "Checkbox", "Table", "Instructions", "Heading", "Measurement", "CalculatedValue", "Result", "Instrument", "Reagent", "ReferenceStandard", "Organism", "Dilution", "IncubationTemperature", "IncubationPeriod", "GrowthObservation", "ColonyCount", "CfuCalculation", "ReferencedResult", "FileUpload"];
export function normalizedOptions(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.map((item) => item.trim()).filter((item) => {
    if (!item || seen.has(item.toLowerCase())) return false;
    seen.add(item.toLowerCase()); return true;
  });
}
export function fieldOptions(type: number, json?: string | null): string[] {
  const authored = json?.trim() ? normalizedOptions(z.array(z.string()).parse(JSON.parse(json))) : [];
  if (authored.length) return authored;
  return type === 13 ? ["Pass", "Fail", "Alert", "OOS"] : type === 21 ? ["Growth", "No Growth", "Absent", "Detected", "TNTC"] : [];
}
export function worksheetColumns(field: WorksheetField) {
  if (!field.columnDefinitions) throw new Error(`${field.label ?? field.fieldKey}: table columns are missing.`);
  return columnSchema.array().min(1).parse(JSON.parse(field.columnDefinitions)).map((column) => {
    const key = column.key || column.columnKey || column.label;
    if (!key) throw new Error("A worksheet column has no key.");
    const type = typeof column.type === "number" ? column.type : typeNames.findIndex((name) => name.toLowerCase() === column.type?.toString().toLowerCase());
    return { ...column, key, label: column.label ?? key, type: type < 0 ? 0 : type,
      fixedValues: column.fixedValues?.map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry)) ?? null,
      calculated: column.mode === 2 || column.mode?.toString().toLowerCase() === "calculated" };
  });
}
export function definitionsFor(field: WorksheetField, extraRows: number = 0): CellDefinition[] {
  if (field.readOnly || field.mode !== 1 || [9, 10, 12, 23, 24].includes(field.type)) return [];
  const base = { fieldKey: field.fieldKey, required: field.requiredForSubmission };
  if (field.type === 8) {
    const columns = worksheetColumns(field);
    const fixedCount = Math.max(0, ...columns.map((column) => column.fixedValues?.length ?? 0));
    const savedCount = Math.max(0, ...field.values.map((entry) => (entry.rowIndex ?? -1) + 1));
    const count = fixedCount || Math.max(1, savedCount) + extraRows;
    if (count > 1000) throw new Error("This worksheet table exceeds the supported 1,000-row limit.");
    return Array.from({ length: count }, (_, rowIndex) => columns.filter((column) => !column.fixedValues && !column.rowHeader && !column.calculated).map((column) => ({
      ...base, rowIndex, columnKey: column.key, label: `Row ${rowIndex + 1} · ${column.label}${column.unit ? ` (${column.unit})` : ""}`, type: column.type, options: column.options?.length ? normalizedOptions(column.options) : fieldOptions(column.type),
    }))).flat();
  }
  if (field.type === 15 || field.type === 16) return [
    { ...base, rowIndex: null, columnKey: "reagentId", label: `${field.label ?? field.fieldKey} · reagent`, type: 15, options: [] },
    { ...base, rowIndex: null, columnKey: "batchNo", label: "Lot / batch number", type: 0, options: [] },
    { ...base, rowIndex: null, columnKey: "expiryDate", label: "Lot expiry", type: 3, options: [] },
  ];
  return [{ ...base, rowIndex: null, columnKey: null, label: `${field.label ?? field.fieldKey}${field.unit ? ` (${field.unit})` : ""}`, type: field.type, options: fieldOptions(field.type, field.optionsJson) }];
}
export function buildWorksheetCells(record: Worksheet, definitions: CellDefinition[]): WorksheetValues {
  const saved = record.sections.flatMap((section) => section.fields.flatMap((field) => field.values));
  return { cells: definitions.map((definition) => ({ fieldKey: definition.fieldKey, rowIndex: definition.rowIndex, columnKey: definition.columnKey,
    value: saved.find((entry) => entry.fieldKey === definition.fieldKey && (entry.rowIndex ?? null) === definition.rowIndex && (entry.columnKey ?? null) === definition.columnKey)?.value ?? "",
  })) };
}
export const worksheetPermission = (track: 0 | 1, action: "start" | "enter" | "submit" | "review") => ({
  start: track === 0 ? "CanStartChemicalWorksheet" : "CanStartMicrobialWorksheet",
  enter: track === 0 ? "CanEnterChemicalWorksheetResult" : "CanEnterMicrobialWorksheetResult",
  submit: track === 0 ? "CanSubmitChemicalWorksheet" : "CanSubmitMicrobialWorksheet",
  review: track === 0 ? "CanReviewChemicalWorksheet" : "CanReviewMicrobialWorksheet",
})[action];
