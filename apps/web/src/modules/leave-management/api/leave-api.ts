import { api } from "@/shared/api/base-api";
export { hrApi as leaveApi } from "@/shared/api/generated/hr";
export const leaveFilesApi = api.injectEndpoints({
  endpoints: (build) => ({
    attachLeaveFiles: build.mutation<void, { id: string; files: readonly File[] }>({
      query: ({ id, files }) => {
        const body = new FormData();
        for (const file of files) body.append("files", file, file.name);
        return {
          url: `/api/v1/file/LeaveRequest/${encodeURIComponent(id)}`,
          method: "POST",
          body,
          headers: { Module: "HR Management", SubModule: "Leave Management" },
        };
      },
      invalidatesTags: (_result, error, arg) =>
        error
          ? []
          : [
              { type: "leave-request", id: arg.id },
              { type: "leave-request", id: "LIST" },
            ],
    }),
  }),
});
