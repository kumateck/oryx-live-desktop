import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { stpDocumentSchema, type StpDocument, type StpOwnerType } from "./stp-document";

export const stpAudit = { module: "Quality Assurance", subModule: "Standard Test Procedure" } as const;

// A document is tagged by its STP (owner) and by its own id, so actions that only know the document still refresh it.
const byOwner = (ownerId: string) => ({ type: "StpDocument" as const, id: ownerId });
const byDocument = (documentId: string) => ({ type: "StpDocument" as const, id: `document:${documentId}` });
const changed = (_result: unknown, error: unknown, arg: { documentId: string }) => error ? [] : [byDocument(arg.documentId)];

export const stpDocumentApi = analyticalApi.enhanceEndpoints({ endpoints: {
  getApiV1StpDocumentsByOwnerTypeAndOwnerId: { providesTags: (result, _error, arg) => [byOwner(arg.ownerId), ...(result?.id ? [byDocument(result.id)] : [])] },
  postApiV1StpDocumentsDocumentsByDocumentIdSubmitReview: { invalidatesTags: changed },
  postApiV1StpDocumentsDocumentsByDocumentIdApprove: { invalidatesTags: changed },
  postApiV1StpDocumentsDocumentsByDocumentIdReject: { invalidatesTags: changed },
} });

const signature = z.object({ password: z.string(), meaning: z.string() });
const editorSessionSchema = z.object({
  config: z.record(z.string(), z.unknown()).refine((config) => typeof config.token === "string" && config.token.length > 0, "The editor session has no security token."),
  documentServerUrl: z.string().url().refine((url) => /^https?:\/\//i.test(url), "The document server address is not a web address."),
});
export type EditorSession = z.infer<typeof editorSessionSchema>;

/**
 * Endpoints the generated client lacks or types wrongly: the upload is multipart (and the file is optional when an approved
 * document is revised from its effective version), review and the editor session are missing from the server's API
 * description, and a version file is a download.
 */
export const stpDocumentExtraApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadStpDocumentVersion: build.mutation<StpDocument | null, { ownerType: StpOwnerType; ownerId: string; file: File | null; reasonForChange?: string }>({
    query: ({ ownerType, ownerId, file, reasonForChange }) => {
      const body = new FormData();
      if (file) body.append("file", file);
      if (reasonForChange?.trim()) body.append("reasonForChange", reasonForChange.trim());
      return { url: `/api/v1/stp-documents/${ownerType}/${ownerId}/versions`, method: "POST", body, headers: { Module: stpAudit.module, SubModule: stpAudit.subModule } };
    },
    transformResponse: (response: unknown) => stpDocumentSchema.parse(response),
    invalidatesTags: (_result, error, arg) => error ? [] : [byOwner(arg.ownerId)],
  }),
  reviewStpDocument: build.mutation<unknown, { documentId: string; body: z.infer<typeof signature> }>({
    query: ({ documentId, body }) => ({ url: `/api/v1/stp-documents/documents/${documentId}/review`, method: "POST", body, headers: { Module: stpAudit.module, SubModule: stpAudit.subModule } }),
    invalidatesTags: changed,
  }),
  openStpEditor: build.mutation<EditorSession, { documentId: string }>({
    query: ({ documentId }) => ({ url: `/api/v1/stp-documents/documents/${documentId}/editor-sessions`, method: "POST", headers: { Module: stpAudit.module, SubModule: stpAudit.subModule } }),
    transformResponse: (response: unknown) => editorSessionSchema.parse(response),
  }),
  /** Resolves to an object URL for the file; the caller revokes it once used. */
  downloadStpDocumentVersion: build.mutation<string, { documentId: string; versionId: string }>({
    query: ({ documentId, versionId }) => ({ url: `/api/v1/stp-documents/documents/${documentId}/versions/${versionId}/file`, headers: { Module: stpAudit.module, SubModule: stpAudit.subModule },
      responseHandler: (response: Response) => response.blob() }),
    transformResponse: (blob: Blob) => URL.createObjectURL(blob),
  }),
}) });
export const stpDocumentTag = byOwner;
