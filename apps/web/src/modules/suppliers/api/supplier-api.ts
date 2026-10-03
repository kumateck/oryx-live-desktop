import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "SupplierList" as const, id: "all" };
export const supplierApi = procurementApi.enhanceEndpoints({ endpoints: {
  getApiV1ProcurementSupplier: { providesTags: [list] },
  getApiV1ProcurementSupplierBySupplierId: { providesTags: (_result, _error, arg) => [{ type: "Supplier", id: arg.supplierId }] },
  postApiV1ProcurementSupplier: { invalidatesTags: (_result, error) => error ? [] : [list] },
  putApiV1ProcurementSupplierBySupplierId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Supplier", id: arg.supplierId }] },
  deleteApiV1ProcurementSupplierBySupplierId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Supplier", id: arg.supplierId }] },
  putApiV1ProcurementSupplierBySupplierIdStatus: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Supplier", id: arg.supplierId }] },
} });

export const {
  useGetApiV1ProcurementSupplierQuery, useGetApiV1ProcurementSupplierBySupplierIdQuery,
  usePostApiV1ProcurementSupplierMutation, usePutApiV1ProcurementSupplierBySupplierIdMutation,
  useDeleteApiV1ProcurementSupplierBySupplierIdMutation, usePutApiV1ProcurementSupplierBySupplierIdStatusMutation,
} = supplierApi;
