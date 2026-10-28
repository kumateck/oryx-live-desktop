import { analyticalApi } from "@/shared/api/generated/analytical";
import { addTags } from "@/shared/api/add-tags";

// The product page's own ARD tag is refreshed too, so a change here shows there.
type Tag = { type: "ProductArds"; id: string } | { type: "ProductArd"; id: "by-product" };
const all: Tag = { type: "ProductArds", id: "all" };
const byProduct: Tag = { type: "ProductArd", id: "by-product" };
const one = (id: string): Tag => ({ type: "ProductArds", id });

export const productArdsApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["ProductArds", "ProductArd"], endpoints: {
  getApiV1ProductArd: (definition) => { definition.providesTags = addTags(definition.providesTags, [all]); },
  getApiV1ProductArdById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  deleteApiV1ProductArdById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [all, byProduct]); },
} });
// Create and update are tagged by the products module; this refreshes these lists after them, approvals and files.
export const productArdChanged = (id: string | null) => productArdsApi.util.invalidateTags([all, byProduct, ...(id ? [one(id)] : [])]);
