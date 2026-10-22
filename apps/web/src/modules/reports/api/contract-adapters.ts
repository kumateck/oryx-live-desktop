import { z } from "zod";
import { api } from "@/shared/api/base-api";
import type { GetApiV1ReportSupplierMaterialsApiArg, GetApiV1ReportEmployeeMovementApiArg } from "@/shared/api/generated/reports";
const text = z.string().nullish();
const party = z.object({ id: text, name: text, address: text, approvedAt: text, validityDate: text }).nullish();
const pack = z.object({ min: z.number().nullish(), max: z.number().nullish(), values: z.array(z.number()).nullish() }).nullish();
const supplierMapping = z.object({
  manufacturers: party, supplier: party, uom: z.object({ id: text, name: text, symbol: text }).nullish(),
  materials: z.array(z.object({ material: z.object({ id: text, name: text, code: text, kind: z.number().int().nullish() }).nullish(), quantityPerPackOption: pack })).nullish(),
});
export const supplierMappingsSchema = z.union([z.array(supplierMapping), supplierMapping]).transform((value) => Array.isArray(value) ? value : [value]);
export type SupplierMapping = z.infer<typeof supplierMapping>;
const movementCounts = z.object({ permanentNew: z.number().optional(), permanentTransfer: z.number().optional(), permanentResignation: z.number().optional(), permanentTermination: z.number().optional(), permanentSDVP: z.number().optional(), casualNew: z.number().optional(), casualResignation: z.number().optional(), casualTermination: z.number().optional(), casualSDVP: z.number().optional(), netMovement: z.number().optional() });
const movement = z.object({ departments: z.array(movementCounts.extend({ departmentName: text })).nullish(), totals: movementCounts.nullish() });
export const employeeMovementSchema = z.union([movement, z.array(movement)]).transform((value) => Array.isArray(value) ? value : [value]);
export type MovementReport = z.infer<typeof movement>;
/** The controller metadata reverses object/array shapes for these two operations; repository return types verified. */
export const reportContractApi = api.injectEndpoints({ endpoints: (build) => ({
  readReportSupplierMappings: build.query<SupplierMapping[], GetApiV1ReportSupplierMaterialsApiArg>({
    query: ({ module, subModule, ...params }) => ({ url: "/api/v1/report/supplier-materials", params, headers: { Module: module ?? "Reports", SubModule: subModule ?? "Supplier material mappings" } }),
    transformResponse: (response) => supplierMappingsSchema.parse(response), providesTags: [{ type: "report", id: "LIST" }],
  }),
  readReportEmployeeMovement: build.query<MovementReport[], GetApiV1ReportEmployeeMovementApiArg>({
    query: ({ module, subModule, ...params }) => ({ url: "/api/v1/report/employee-movement", params, headers: { Module: module ?? "Reports", SubModule: subModule ?? "Employee movement" } }),
    transformResponse: (response) => employeeMovementSchema.parse(response), providesTags: [{ type: "report", id: "LIST" }],
  }),
}) });
