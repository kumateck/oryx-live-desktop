import { z } from "zod";
import { api } from "@/shared/api/base-api";
import type { GetApiV1MaterialDepartmentApprovedMaterialsV2ApiArg } from "@/shared/api/generated/materials";
import type { GetApiV1ReportVendorItemSummaryApiArg } from "@/shared/api/generated/reports";
const text = z.string().nullish();
const named = z.object({ id: text, name: text, symbol: text }).nullish();
const materialDetail = z.object({ material: z.object({ id: text, name: text, code: text, kind: z.number().int().nullish(), materialCategory: named }).nullish(), unitOfMeasure: named, totalAvailableQuantity: z.number().nullish(), reservedQuantity: z.number().nullish() });
export const approvedMaterialReportSchema = z.union([
  z.array(materialDetail),
  z.object({ data: z.array(materialDetail), pageCount: z.number().optional() }).refine((page) => (page.pageCount ?? 1) <= 1, "The server returned only part of the material master report.").transform((page) => page.data),
]);
export type ApprovedMaterialRow = z.infer<typeof materialDetail>;
const vendorSummary = z.object({ no: z.number().int().nullish(), store: z.number().int().nullish(), itemName: text, itemCode: text, category: text, classification: z.number().int().nullish(), vendorCount: z.number().int().nullish() });
export const vendorSummarySchema = z.array(vendorSummary);
export type VendorSummaryRow = z.infer<typeof vendorSummary>;
/** Repository returns a complete list and a distinct vendor-count DTO; both controller annotations are inaccurate. */
export const materialReportApi = api.injectEndpoints({ endpoints: (build) => ({
  readApprovedMaterialReport: build.query<ApprovedMaterialRow[], GetApiV1MaterialDepartmentApprovedMaterialsV2ApiArg>({
    query: ({ module, subModule, ...params }) => ({ url: "/api/v1/material/department/approved-materials/v2", params, headers: { Module: module ?? "Reports", SubModule: subModule ?? "Material master" } }),
    transformResponse: (response) => approvedMaterialReportSchema.parse(response), providesTags: [{ type: "report", id: "LIST" }],
  }),
  readVendorItemSummaryReport: build.query<VendorSummaryRow[], GetApiV1ReportVendorItemSummaryApiArg>({
    query: ({ module, subModule, ...params }) => ({ url: "/api/v1/report/vendor-item/summary", params, headers: { Module: module ?? "Reports", SubModule: subModule ?? "Vendor item summary" } }),
    transformResponse: (response) => vendorSummarySchema.parse(response), providesTags: [{ type: "report", id: "LIST" }],
  }),
}) });
