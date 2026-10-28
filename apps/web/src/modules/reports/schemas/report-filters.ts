import { z } from "zod";
export const reportOptionSchema = z.object({ value: z.string().min(1), label: z.string(), code: z.string().optional(), name: z.string().optional() });
const option = reportOptionSchema.nullable();
export type ReportOption = z.infer<typeof reportOptionSchema>;
export const reportSelectNames = ["warehouseType", "department", "material", "materialKind", "category", "product", "warehouse", "supplier", "manufacturer", "vendor", "item", "customer", "store", "classification", "employeeType", "grade", "status", "division", "supplierType", "valuationType"] as const;
export type ReportSelectName = typeof reportSelectNames[number];
const emptySelections = () => ({ warehouseType: [], department: [], material: [], materialKind: [], category: [], product: [], warehouse: [], supplier: [], manufacturer: [], vendor: [], item: [], customer: [], store: [], classification: [], employeeType: [], grade: [], status: [], division: [], supplierType: [], valuationType: [] });
const date = z.date().nullable();
export const reportFiltersSchema = z.object({
  selections: z.object({
    warehouseType: z.array(reportOptionSchema), department: z.array(reportOptionSchema), material: z.array(reportOptionSchema), materialKind: z.array(reportOptionSchema), category: z.array(reportOptionSchema), product: z.array(reportOptionSchema), warehouse: z.array(reportOptionSchema), supplier: z.array(reportOptionSchema), manufacturer: z.array(reportOptionSchema), vendor: z.array(reportOptionSchema), item: z.array(reportOptionSchema), customer: z.array(reportOptionSchema), store: z.array(reportOptionSchema), classification: z.array(reportOptionSchema), employeeType: z.array(reportOptionSchema), grade: z.array(reportOptionSchema), status: z.array(reportOptionSchema), division: z.array(reportOptionSchema), supplierType: z.array(reportOptionSchema), valuationType: z.array(reportOptionSchema),
  }),
  warehouseType: option, department: option, material: option, materialKind: option, category: option, product: option, warehouse: option,
  supplier: option, manufacturer: option, vendor: option, item: option, customer: option, store: option, classification: option,
  employeeType: option, grade: option, status: option, division: option, supplierType: option, valuationType: option,
  supplierIds: z.array(z.object({ value: z.string().min(1), label: z.string() })), statuses: z.array(z.object({ value: z.string().min(1), label: z.string() })),
  asOfDate: date, asOfInstant: z.string().nullable(), startDate: date, endDate: date, expiryDateFrom: date, expiryDateTo: date, validityDateFrom: date, validityDateTo: date, date,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid month").nullable(), poNumber: z.string().trim().max(100), batchNumber: z.string().trim().max(100), materialName: z.string().trim().max(200), supplierName: z.string().trim().max(200), manufacturerName: z.string().trim().max(200),
}).superRefine((values, context) => {
  for (const [from, to] of [["startDate", "endDate"], ["expiryDateFrom", "expiryDateTo"], ["validityDateFrom", "validityDateTo"]] as const) {
    if (values[from] && values[to] && values[from] > values[to]) context.addIssue({ code: "custom", path: [to], message: "End date must be on or after the start date." });
  }
});
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export type ReportFieldName = Exclude<keyof ReportFilters, "selections" | "asOfInstant">;
export const emptyReportFilters = (): ReportFilters => ({
  selections: emptySelections(),
  warehouseType: null, department: null, material: null, materialKind: null, category: null, product: null, warehouse: null, supplier: null, manufacturer: null, vendor: null, item: null, customer: null, store: null, classification: null, employeeType: null, grade: null, status: null, division: null, supplierType: null, valuationType: null,
  supplierIds: [], statuses: [], asOfDate: null, asOfInstant: null, startDate: null, endDate: null, expiryDateFrom: null, expiryDateTo: null, validityDateFrom: null, validityDateTo: null,
  date: new Date(), month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, poNumber: "", batchNumber: "", materialName: "", supplierName: "", manufacturerName: "",
});
