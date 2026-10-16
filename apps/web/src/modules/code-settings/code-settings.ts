import { z } from "zod";
import { settingsApi } from "@/shared/api/generated/settings";
import { generateCode } from "@/shared/codes/generate-code";
import { addTags } from "@/shared/api/add-tags";

export const codePermissions = { view: "CanViewCodeSettings", add: "CanCreateNewCodes", edit: "CanEditCodeSettings", remove: "CanDeleteCodeSettings" } as const;
export const codeAudit = { module: "Settings", subModule: "Code Settings" } as const;
/** The record types a code rule can be set for. The values are the server's names. */
export const modelTypes = ["Product", "WorkOrder", "Stock", "RequestOrder", "Requisition", "RawMaterial", "Warehouse", "PackageMaterial", "ProductionSchedule", "Department", "PurchaseOrder", "ShipmentDocument", "MaterialStandardTestProcedure",
  "ProductStandardTestProcedure", "GrnNumber", "StockTransfer", "Waybill", "BillingSheet", "Employee", "LeaveRequest", "Overtime", "MaterialAnalyticalRawData", "ProductAnalyticalRawData", "FinishedGoodsTransferNote", "Service", "ProductBatchNumber",
  "ProductionOrder", "Item", "ArNumberMaterial", "ArNumberProduct", "MaterialSTPNumber", "ProductSTPNumber", "ProformaInvoice", "MaterialSpecNumber", "ProductSpecNumber", "JobRequest", "JobOrder", "InventoryPurchaseRequisition", "ItemStockRequisition",
  "MaterialBatchIssueNumber", "AtrIssueNumber"] as const;
/** "GrnNumber" reads "Grn Number"; runs of capitals such as STP stay together. */
export const spaced = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
export const modelTypeOptions = modelTypes.map((value) => ({ value, label: spaced(value) }));
// The numbers are the server's.
export const namingTypeOptions = [{ value: "0", label: "Series" }, { value: "1", label: "Random" }, { value: "2", label: "Time" }] as const;
export const namingTypeLabel = (value: number) => namingTypeOptions.find((item) => item.value === String(value))?.label ?? "Other";

const list = { type: "CodeSettings" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
export const codeApi = settingsApi.enhanceEndpoints({ endpoints: { getApiV1Configuration: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1ConfigurationByModelTypeByModelType: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, postApiV1Configuration: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  putApiV1ConfigurationByConfigurationId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, deleteApiV1ConfigurationByConfigurationId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
export const codeRowsSchema = z.array(z.object({ id: z.string().nullish(), modelType: text, prefix: text, namingType: z.number().nullish(), minimumNameLength: z.number().nullish(), maximumNameLength: z.number().nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, modelType: row.modelType ?? "", prefix: row.prefix ?? "", namingType: row.namingType ?? 0, minimum: row.minimumNameLength ?? 0, maximum: row.maximumNameLength ?? 0 }] : []));
export type CodeRule = z.infer<typeof codeRowsSchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const length = (name: string, low: number, high: number) => z.number({ error: `Enter the ${name} length` }).int("Use a whole number").min(low, `The ${name} length is at least ${low}`).max(high, `The ${name} length is at most ${high}`);
export const codeFormSchema = z.object({
  modelType: option.nullable().refine((value): boolean => Boolean(value), "Choose what the code is for"),
  namingType: option.nullable().refine((value): boolean => Boolean(value), "Choose how the code is numbered"),
  prefix: z.string().trim().min(1, "Enter the prefix").max(20, "Keep the prefix under 20 characters"),
  minimum: length("minimum", 1, 7), maximum: length("maximum", 3, 15),
}).refine((values) => values.maximum >= values.minimum, { path: ["maximum"], message: "The maximum length cannot be less than the minimum" });
export type CodeFormValues = z.infer<typeof codeFormSchema>;
export const codeDefaults = (rule: CodeRule | null): Partial<CodeFormValues> => rule
  ? { prefix: rule.prefix, minimum: rule.minimum, maximum: rule.maximum, namingType: { value: String(rule.namingType), label: namingTypeLabel(rule.namingType) },
    // The server has returned the type with a lower-case first letter; it is matched to the listed name either way.
    modelType: (() => { const found = modelTypes.find((item) => item.toLowerCase() === rule.modelType.toLowerCase()); return { value: found ?? rule.modelType, label: spaced(found ?? rule.modelType) }; })() }
  : { prefix: "", namingType: null, modelType: null };
/** What the first code made by a rule looks like. */
export const exampleCode = (rule: Pick<CodeRule, "prefix" | "namingType" | "minimum" | "maximum">) => generateCode({ prefix: rule.prefix, namingType: rule.namingType, minimumLength: rule.minimum, maximumLength: rule.maximum }, 0, () => 0.123456789012345, () => 1767225600000);
/** A record type can have one rule: the types that already have one are not offered again. */
export const freeModelTypes = (rules: readonly CodeRule[], editing: CodeRule | null) => modelTypeOptions.filter((item) => item.value.toLowerCase() === editing?.modelType.toLowerCase() || !rules.some((rule) => rule.modelType.toLowerCase() === item.value.toLowerCase()));
