import { api } from "@/shared/api/base-api";
export const itemFilesApi = api.injectEndpoints({
  endpoints: (b) => ({
    attachInventoryFiles: b.mutation<void, { id: string; files: readonly File[] }>({
      query: ({ id, files }) => {
        const body = new FormData();
        for (const f of files) body.append("files", f, f.name);
        return {
          url: `/api/v1/file/Item/${encodeURIComponent(id)}`,
          method: "POST",
          body,
          headers: { Module: "General Stores", SubModule: "Inventory attachments" },
        };
      },
      invalidatesTags: (_r, e, a) =>
        e
          ? []
          : [
              { type: "item", id: a.id },
              { type: "item", id: "LIST" },
            ],
    }),
    removeInventoryFile: b.mutation<void, { id: string; reference: string }>({
      query: ({ id, reference }) => ({
        url: `/api/v1/file/${encodeURIComponent(id)}/${encodeURIComponent(reference)}`,
        method: "DELETE",
        headers: { Module: "General Stores", SubModule: "Inventory attachments" },
      }),
      invalidatesTags: (_r, e, a) =>
        e
          ? []
          : [
              { type: "item", id: a.id },
              { type: "item", id: "LIST" },
            ],
    }),
  }),
});
