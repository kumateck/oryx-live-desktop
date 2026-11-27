import { addTags } from "@/shared/api/add-tags";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { proposalSchema, type ImportProposal } from "./stp-content";
import { stpRevisionAudit, stpRevisionModelType, type StpKind } from "./stp-keys";

const list = { type: "stp-revision" as const, id: "LIST" };
const review = (id: string) => [{ type: "DocumentReview" as const, id: `${stpRevisionModelType}:${id}` }, { type: "PendingReviews" as const, id: "all" }];

const revisionApi = analyticalApi.enhanceEndpoints({
  addTagTypes: ["DocumentReview", "PendingReviews", "PendingApprovals"],
  endpoints: {
    // The numbers overview changes with every revision write.
    getApiV1StpRevisionsNumbers: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    postApiV1StpRevisionsRevise: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_r, error) => error ? [] : [list]); },
    postApiV1StpRevisionsByIdSubmit: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_r, error, { id }) => error ? [] : [list, ...review(id)]);
    },
    putApiV1StpRevisionsById: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_r, error, { id }) => error ? [] : [list, ...review(id)]);
    },
    deleteApiV1StpRevisionsById: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_r, error, { id }) => error ? [] : [list, ...review(id), { type: "PendingApprovals", id: "all" }]);
    },
  },
}).injectEndpoints({ endpoints: (build) => ({
  // The generated operation would send the file as JSON; a Word upload is multipart.
  importStpRevisionFile: build.mutation<ImportProposal, { kind: StpKind; file: File }>({
    query: ({ kind, file }) => {
      const body = new FormData();
      body.append("file", file);
      return { url: "/api/v1/stp-revisions/import", method: "POST", params: { kind }, body,
        headers: { Module: stpRevisionAudit.module, SubModule: stpRevisionAudit.subModule } };
    },
    transformResponse: (response: unknown) => proposalSchema.parse(response),
  }),
}) });

// Only the STP content components import these.
export const {
  useGetApiV1StpRevisionsQuery: useStpRevisionsQuery,
  useGetApiV1StpRevisionsNumbersQuery: useStpNumbersQuery,
  useGetApiV1StpRevisionsByIdQuery: useStpRevisionQuery,
  usePostApiV1StpRevisionsMutation: useCreateStpRevisionMutation,
  usePostApiV1StpRevisionsReviseMutation: useReviseStpRevisionMutation,
  usePutApiV1StpRevisionsByIdDraftMutation: useSaveStpRevisionDraftMutation,
  usePostApiV1StpRevisionsByIdSubmitMutation: useSubmitStpRevisionMutation,
  usePutApiV1StpRevisionsByIdMutation: useCorrectStpRevisionMutation,
  useDeleteApiV1StpRevisionsByIdMutation: useDeleteStpRevisionMutation,
  usePostApiV1StpRevisionsImportDocumentMutation: useImportStpDocumentMutation,
  useImportStpRevisionFileMutation,
} = revisionApi;
