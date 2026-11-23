import { procurementApi } from "@/shared/api/generated/procurement";

// The approved vendor list's endpoints. Only this module's components import them.
export const {
  useGetApiV1ApprovedVendorListQuery: useVendorListsQuery,
  useGetApiV1ApprovedVendorListByIdQuery: useVendorListQuery,
  useGetApiV1ApprovedVendorListByIdPrintQuery: useVendorListPrintQuery,
  useGetApiV1ApprovedVendorListOptionsQuery: useVendorOptionsQuery,
  useLazyGetApiV1ApprovedVendorListMappingsByMaterialIdQuery: useLazyVendorMappingsQuery,
  usePostApiV1ApprovedVendorListMutation: useCreateVendorListMutation,
  usePostApiV1ApprovedVendorListReviseMutation: useReviseVendorListMutation,
  usePutApiV1ApprovedVendorListByIdMutation: useUpdateVendorListMutation,
  useDeleteApiV1ApprovedVendorListByIdMutation: useDeleteVendorListMutation,
} = procurementApi;
