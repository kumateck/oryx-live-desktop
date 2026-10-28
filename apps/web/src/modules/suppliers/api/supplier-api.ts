import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "SupplierList" as const, id: "all" };
export const supplierApi = procurementApi.enhanceEndpoints({ endpoints: {
  getApiV1ProcurementSupplier: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1ProcurementSupplierBySupplierIdMaterial: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "procurement/supplier", id: "LIST" }, { type: "Supplier", id: arg.supplierId }]); },
  getApiV1ProcurementSupplierBySupplierId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Supplier", id: arg.supplierId }]); },
  postApiV1ProcurementSupplier: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list]); },
  putApiV1ProcurementSupplierBySupplierId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Supplier", id: arg.supplierId }, { type: "Supplier", id: `${arg.supplierId}:pricing` }]); },
  deleteApiV1ProcurementSupplierBySupplierId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Supplier", id: arg.supplierId }, { type: "Supplier", id: `${arg.supplierId}:pricing` }]); },
  putApiV1ProcurementSupplierBySupplierIdStatus: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Supplier", id: arg.supplierId }, { type: "Supplier", id: `${arg.supplierId}:pricing` }]); },
} });

export const {
  useGetApiV1ProcurementSupplierQuery, useGetApiV1ProcurementSupplierBySupplierIdQuery,
  usePostApiV1ProcurementSupplierMutation, usePutApiV1ProcurementSupplierBySupplierIdMutation,
  useDeleteApiV1ProcurementSupplierBySupplierIdMutation, usePutApiV1ProcurementSupplierBySupplierIdStatusMutation,
} = supplierApi;
