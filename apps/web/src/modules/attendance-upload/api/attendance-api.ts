import { api } from "@/shared/api/base-api";
export const attendanceUploadApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadAttendanceFile: build.mutation<void, { file: File; date: string }>({
    query: ({ file, date }) => { const body = new FormData(); body.append("attendance", file, file.name); return { url: `/api/v1/attendance-records/upload/${encodeURIComponent(date)}`, method: "POST", params: { date }, body, headers: { Module: "HR Management", SubModule: "Attendance report upload" } }; },
    invalidatesTags: (_result, error) => error ? [] : [{ type: "attendance-record", id: "LIST" }, { type: "report/hr", id: "LIST" }],
  }),
}) });
