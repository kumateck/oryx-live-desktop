import { api } from "@/shared/api/base-api";
export const serviceFilesApi = api.injectEndpoints({
  endpoints: (build) => ({
    attachServiceFiles: build.mutation<void, { id: string; files: readonly File[] }>({
      query: ({ id, files }) => {
        const body = new FormData();
        for (const file of files) body.append("files", file, file.name);
        return {
          url: `/api/v1/file/Service/${encodeURIComponent(id)}`,
          method: "POST",
          body,
          headers: { Module: "Services", SubModule: "Service attachments" },
        };
      },
      invalidatesTags: (_r, error, arg) =>
        error
          ? []
          : [
              { type: "service", id: arg.id },
              { type: "service", id: "LIST" },
            ],
    }),
    removeServiceFile: build.mutation<void, { id: string; reference: string }>({
      query: ({ id, reference }) => ({
        url: `/api/v1/file/${encodeURIComponent(id)}/${encodeURIComponent(reference)}`,
        method: "DELETE",
        headers: { Module: "Services", SubModule: "Service attachments" },
      }),
      invalidatesTags: (_r, error, arg) =>
        error
          ? []
          : [
              { type: "service", id: arg.id },
              { type: "service", id: "LIST" },
            ],
    }),
  }),
});
