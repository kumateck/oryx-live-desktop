import { materialsApi } from "@/shared/api/generated/materials";
import { addTags } from "@/shared/api/add-tags";

const records = { type: "WhitePlacebo" as const, id: "department" };
export const whitePlaceboApi = materialsApi.enhanceEndpoints({ addTagTypes: ["WhitePlacebo"], endpoints: {
  getWhitePlaceboWorkspace: (definition) => { definition.providesTags = addTags(definition.providesTags, [records]); },
  listWhitePlaceboPreparations: (definition) => { definition.providesTags = addTags(definition.providesTags, [records]); },
  getWhitePlaceboPreparation: (definition) => { definition.providesTags = addTags(definition.providesTags, [records]); },
  saveWhitePlaceboRecipe: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [records, { type: "MaterialList", id: "all" }, { type: "material", id: "LIST" }]); },
  createWhitePlaceboPreparation: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [records, { type: "RequisitionList", id: "all" }, { type: "PendingApprovals", id: "all" }]); },
  issueWhitePlaceboIngredients: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [
    records, { type: "RequisitionList", id: "all" }, { type: "material", id: "LIST" }, { type: "StockOnShelves", id: "all" }, { type: "PendingApprovals", id: "all" },
  ]); },
  recordWhitePlaceboOutput: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [records, { type: "Grns", id: "all" }, { type: "MaterialList", id: "all" }]); },
} });
export const { useGetWhitePlaceboWorkspaceQuery, useListWhitePlaceboPreparationsQuery, useGetWhitePlaceboPreparationQuery,
  useSaveWhitePlaceboRecipeMutation, useCreateWhitePlaceboPreparationMutation, useIssueWhitePlaceboIngredientsMutation,
  useRecordWhitePlaceboOutputMutation } = whitePlaceboApi;
