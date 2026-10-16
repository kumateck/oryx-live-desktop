import { analyticalApi } from "@/shared/api/generated/analytical";

// The lists, one tag per specification, and the product page's own specification list, so a change here shows there too.
type Tag = { type: "ProductSpecifications"; id: string } | { type: "ProductSpecification"; id: "by-product" };
const all: Tag = { type: "ProductSpecifications", id: "all" };
const byProduct: Tag = { type: "ProductSpecification", id: "by-product" };
const one = (id: string): Tag => ({ type: "ProductSpecifications", id });
const after = (tags: Tag[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const productSpecificationsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["ProductSpecifications", "ProductSpecification"], endpoints: {
  getApiV1ProductSpecifications: { providesTags: [all] },
  getApiV1ProductSpecificationsById: { providesTags: (_result, _error, arg) => [one(arg.id)] },
  getApiV1ProductSpecificationsProducts: { providesTags: [all] },
  deleteApiV1ProductSpecificationsById: { invalidatesTags: after([all, byProduct]) },
  postApiV1ProductSpecificationsAddRemoveProducts: { invalidatesTags: after([all, byProduct]) },
} });
// Create and update are already tagged by the products module for its own list; these add this module's tags as an action after a save.
export const productSpecificationChanged = (id: string | null) => productSpecificationsApi.util.invalidateTags([all, byProduct, ...(id ? [one(id)] : [])]);
