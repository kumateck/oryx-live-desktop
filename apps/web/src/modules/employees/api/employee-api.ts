import { api } from "@/shared/api/base-api";
import { hrApi } from "@/shared/api/generated/hr";
export { hrApi as employeeApi };
export type { DomainEntitiesEmployeesEmployeeDto as Employee } from "@/shared/api/generated/hr";
export const employeeFileApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadEmployeePhoto: build.mutation<void, { id: string; file: File }>({
    query: ({ id, file }) => { const body = new FormData(); body.append("files", file, file.name); return { url: `/api/v1/file/Employee/${encodeURIComponent(id)}`, method: "POST", body, headers: { Module: "HR Management", SubModule: "Employee photograph" } }; },
    invalidatesTags: (_result, error, arg) => error ? [] : [{ type: "employee", id: arg.id }],
  }),
}) });
