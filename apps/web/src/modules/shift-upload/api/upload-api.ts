import { api } from "@/shared/api/base-api";
export const shiftUploadApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadShiftWorkbook: build.mutation<void, { file: File; departmentId: string; shiftId: string }>({
      query: ({ file, departmentId, shiftId }) => {
        const body = new FormData();
        body.append("file", file, file.name);
        return {
          url: "/api/v1/shift-schedules/assign/import",
          method: "POST",
          params: { departmentId, shiftId },
          body,
          headers: { Module: "HR Management", SubModule: "Shift Schedule Upload" },
        };
      },
      invalidatesTags: (_r, error, arg) =>
        error
          ? []
          : [
              { type: "shift-schedule", id: arg.shiftId },
              { type: "shift-schedule", id: "LIST" },
              { type: "employee", id: arg.shiftId },
            ],
    }),
  }),
});
