import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

// The product page's own STP tag is refreshed too, so a change here shows there.
type Tag = { type: "ProductStps"; id: string } | { type: "ProductStp"; id: "by-product" };
const all: Tag = { type: "ProductStps", id: "all" };
const byProduct: Tag = { type: "ProductStp", id: "by-product" };
const one = (id: string): Tag => ({ type: "ProductStps", id });
const after = (tags: Tag[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const productStpsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["ProductStps", "ProductStp"], endpoints: {
  getApiV1ProductStps: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  getApiV1ProductStpsById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  getApiV1ProductStpsByStpNumberProducts: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  deleteApiV1ProductStpsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all, byProduct])); },
  postApiV1ProductStpsAddRemoveProducts: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all, byProduct])); },
} });
// Create and update are tagged by the products module for its list; this refreshes these lists after either.
export const productStpChanged = (id: string | null) => productStpsApi.util.invalidateTags([all, byProduct, ...(id ? [one(id)] : [])]);
