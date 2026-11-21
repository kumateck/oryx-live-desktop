import { salesApi } from "@/shared/api/generated/sales";
import { addTags } from "@/shared/api/add-tags";

// A correction changes its revision header/version as well as its prices. Approval refreshes on focus and explicit review callbacks.
const lists = { type: "costing/price-list" as const, id: "LIST" };
export const priceListApi = salesApi.enhanceEndpoints({ endpoints: {
  putApiV1CostingPriceListsByIdLines: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags,
    (_result, error, arg) => error ? [] : [lists, { type: "costing/price-list", id: arg.id }]); },
  postApiV1CostingPriceListsByIdSubmit: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags,
    (_result, error, arg) => error ? [] : [lists, { type: "costing/price-list", id: arg.id }]); },
} });

export const {
  useGetApiV1CostingPriceListsQuery: usePriceListsQuery,
  useGetApiV1CostingPriceListsByIdQuery: usePriceListQuery,
  useGetApiV1CostingPriceListsByIdLinesQuery: usePriceListLinesQuery,
  useGetApiV1CostingPriceListsByIdPrintQuery: usePriceListPrintQuery,
  useLazyGetApiV1CostingPriceListsProductsQuery: usePackingChoicesQuery,
  usePostApiV1CostingPriceListsMutation: usePreparePriceListMutation,
  usePostApiV1CostingPriceListsReviseMutation: useRevisePriceListMutation,
  usePutApiV1CostingPriceListsByIdMutation: useUpdatePriceListMutation,
  usePutApiV1CostingPriceListsByIdLinesMutation: useSavePriceListLineMutation,
  usePostApiV1CostingPriceListsByIdSubmitMutation: useSubmitPriceListMutation,
} = priceListApi;
