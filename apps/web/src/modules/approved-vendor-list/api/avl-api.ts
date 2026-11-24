import { addTags } from "@/shared/api/add-tags";
import { procurementApi } from "@/shared/api/generated/procurement";
import { avlModelType } from "../lib/keys";

const vendorListApi = procurementApi.enhanceEndpoints({
  endpoints: {
    deleteApiV1ApprovedVendorListById: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, { id }) => error ? [] : [
        { type: "DocumentReview", id: `${avlModelType}:${id}` },
        { type: "PendingReviews", id: "all" },
        { type: "PendingApprovals", id: "all" },
      ]);
    },
  },
});

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
} = vendorListApi;
