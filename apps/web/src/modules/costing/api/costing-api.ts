import { addTags } from "@/shared/api/add-tags";
import { productsApi } from "@/shared/api/generated/products";
import { salesApi } from "@/shared/api/generated/sales";
import { settingsApi } from "@/shared/api/generated/settings";

const agreements = { type: "costing/pricing-agreement" as const, id: "LIST" };
const agreement = (id: string) => ({ type: "costing/pricing-agreement" as const, id });
// Agreements are written through the customer endpoints, so their saves also refresh the costing lists.
export const costingApi = salesApi.enhanceEndpoints({ endpoints: {
  postApiV1CustomersByIdPricingAgreements: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [agreements]); },
  putApiV1CustomersByIdPricingAgreementsAndAgreementId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [agreements, agreement(arg.agreementId)]); },
  deleteApiV1CustomersByIdPricingAgreementsAndAgreementId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [agreements, agreement(arg.agreementId)]); },
} });
export const { useGetApiV1CostingListPricesQuery, useGetApiV1CostingListPricesByProductIdHistoryQuery, usePutApiV1CostingListPricesByProductIdMutation,
  useGetApiV1CostingPricingAgreementsQuery, useGetApiV1CostingPricingAgreementsByIdQuery, usePostApiV1CustomersByIdPricingAgreementsMutation,
  usePutApiV1CustomersByIdPricingAgreementsAndAgreementIdMutation, useDeleteApiV1CustomersByIdPricingAgreementsAndAgreementIdMutation, useLazyGetApiV1CustomersQuery } = costingApi;
export const { useLazyGetApiV1ProductQuery, useLazyGetApiV1ProductByProductIdPackingQuery } = productsApi;
export const { usePostApiV1CollectionMutation } = settingsApi;
export type { DomainEntitiesCostingProductListPriceDto as ListPrice, DomainEntitiesCostingListPriceHistoryDto as ListPriceHistory,
  DomainEntitiesCustomersCustomerPricingAgreementDto as PricingAgreement } from "@/shared/api/generated/sales";
