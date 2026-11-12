import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

// The lists, one tag per specification, and the product page's own specification list, so a change here shows there too.
type Tag = { type: "ProductSpecifications"; id: string } | { type: "ProductSpecification"; id: "by-product" };
const all: Tag = { type: "ProductSpecifications", id: "all" };
const byProduct: Tag = { type: "ProductSpecification", id: "by-product" };
const one = (id: string): Tag => ({ type: "ProductSpecifications", id });
const after = (tags: Tag[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const productSpecificationsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["ProductSpecifications", "ProductSpecification"], endpoints: {
  getApiV1ProductSpecifications: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  getApiV1ProductSpecificationsById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  getApiV1ProductSpecificationsProducts: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  postApiV1ProductSpecifications: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all, byProduct])); },
  putApiV1ProductSpecificationsById: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (result, error, arg) => {
      if (error) return [];
      // The server updates every product record that shares the specification number.
      const linked = result?.flatMap(({ specificationId }) => specificationId && specificationId !== arg.id ? [one(specificationId)] : []) ?? [];
      return [all, byProduct, one(arg.id), ...linked];
    });
  },
  deleteApiV1ProductSpecificationsById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all, byProduct])); },
  postApiV1ProductSpecificationsAddRemoveProducts: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, after([all, byProduct])); },
} });
/** After an approval, which uses a shared endpoint. */
export const productSpecificationChanged = (id: string) => productSpecificationsApi.util.invalidateTags([all, byProduct, one(id)]);
