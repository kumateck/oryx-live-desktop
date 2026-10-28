import { settingsApi } from "@/shared/api/generated/settings";
import type { PostApiV1CollectionUomByUomIdApiResponse } from "@/shared/api/generated/settings";
import { collectionAudit } from "../lib/collections";
import { addTags } from "@/shared/api/add-tags";

const collectionTag = (model: string) => [{ type: "ConfigurationCollection" as const, id: model }];

export const collectionApi = settingsApi.enhanceEndpoints({ addTagTypes: ["ConfigurationCollection", "ConfigurationUnit"], endpoints: {
  getApiV1CollectionByItemType: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => collectionTag(arg.itemType)); },
  postApiV1CollectionByItemType: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : collectionTag(arg.itemType)); },
  putApiV1CollectionByItemTypeAndItemId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : collectionTag(arg.itemType)); },
  deleteApiV1CollectionByItemTypeAndItemId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : collectionTag(arg.itemType)); },
  postApiV1CollectionUom: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : collectionTag("UnitOfMeasure")); },
  putApiV1CollectionUomByUomId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [...collectionTag("UnitOfMeasure"), { type: "ConfigurationUnit", id: arg.uomId }]); },
  deleteApiV1CollectionUomByUomId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [...collectionTag("UnitOfMeasure"), { type: "ConfigurationUnit", id: arg.uomId }]); },
} }).injectEndpoints({ endpoints: (build) => ({
  // These read endpoints use POST in the contract. Query aliases let RTK Query cache them.
  getConfigurationUnit: build.query<PostApiV1CollectionUomByUomIdApiResponse, string>({
    query: (id) => ({ url: `/api/v1/collection/uom/${id}`, method: "POST", headers: { Module: collectionAudit.module, SubModule: collectionAudit.subModule } }),
    providesTags: (_result, _error, id) => [{ type: "ConfigurationUnit", id }],
  }),
}) });

export const {
  useGetApiV1CollectionByItemTypeQuery,
  usePostApiV1CollectionByItemTypeMutation,
  usePutApiV1CollectionByItemTypeAndItemIdMutation,
  useDeleteApiV1CollectionByItemTypeAndItemIdMutation,
  useGetConfigurationUnitQuery,
  usePostApiV1CollectionUomMutation,
  usePutApiV1CollectionUomByUomIdMutation,
  useDeleteApiV1CollectionUomByUomIdMutation,
} = collectionApi;
