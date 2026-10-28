import { api } from "@/shared/api/base-api";

// The stock, attendance and shift uploads are multipart and the templates are files, which the generated client does
// not describe correctly, so they are declared here.
const settings = { Module: "Settings", SubModule: "Configurations" };
const multipart = (field: string, file: File) => { const body = new FormData(); body.append(field, file, file.name); return body; };
const blob = (response: Response) => response.blob();

export const uploadApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadMaterialStock: build.mutation<void, { file: File; departmentId: string }>({
    query: ({ file, departmentId }) => ({ url: "/api/v1/material/upload/stock", method: "POST", body: multipart("file", file), params: { departmentId }, headers: settings }),
  }),
  uploadProductStock: build.mutation<void, { file: File }>({
    query: ({ file }) => ({ url: "/api/v1/product/upload/stock", method: "POST", body: multipart("file", file), headers: settings }),
  }),
  /** The day's attendance; the date is in the path and the query, as the server reads both. */
  uploadAttendance: build.mutation<void, { file: File; date: string }>({
    query: ({ file, date }) => ({ url: `/api/v1/attendance-records/upload/${encodeURIComponent(date)}`, method: "POST", body: multipart("attendance", file), params: { date },
      headers: { Module: "Warehouse", SubModule: "Attendance Report" } }),
  }),
  uploadShiftAssignments: build.mutation<void, { file: File; departmentId: string; shiftId: string }>({
    query: ({ file, departmentId, shiftId }) => ({ url: "/api/v1/shift-schedules/assign/import", method: "POST", body: multipart("file", file), params: { departmentId, shiftId },
      headers: { Module: "Management", SubModule: "Shift Upload" } }),
  }),
  /** Resolve to an object URL for the template file; the caller revokes it once saved. */
  materialTemplate: build.mutation<string, { kind: 0 | 1; departmentId?: string }>({
    query: ({ kind, departmentId }) => ({ url: "/api/v1/material/download/stock", params: { kind, ...(departmentId ? { departmentId } : {}) }, headers: settings, responseHandler: blob }),
    transformResponse: (file: Blob) => URL.createObjectURL(file),
  }),
  productTemplate: build.mutation<string, { division: 0 | 1; departmentId?: string }>({
    query: ({ division, departmentId }) => ({ url: "/api/v1/product/download", params: { departmentDivision: division, ...(departmentId ? { departmentId } : {}) }, headers: settings, responseHandler: blob }),
    transformResponse: (file: Blob) => URL.createObjectURL(file),
  }),
}) });
