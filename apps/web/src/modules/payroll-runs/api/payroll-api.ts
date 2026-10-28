import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { runSchema, runsSchema, slipsSchema, slipSchema, type PayrollRun, type Payslip } from "../schemas/contracts";
const headers = { Module: "HR Management", SubModule: "Payroll Runs" };
const type = "PayrollRuns" as const;
export const payrollApi = api.enhanceEndpoints({ addTagTypes: [type] }).injectEndpoints({
  endpoints: (build) => ({
    payrollRuns: build.query<z.infer<typeof runsSchema>, { page: number; pageSize: number; status?: PayrollRun["status"] }>({
      query: (params) => ({ url: "/api/v1/payroll/runs", params, headers }),
      rawResponseSchema: runsSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "Invalid payroll register returned by the server." }),
      providesTags: [{ type, id: "LIST" }],
    }),
    payrollRun: build.query<PayrollRun, string>({
      query: (id) => ({ url: `/api/v1/payroll/runs/${encodeURIComponent(id)}`, headers }),
      rawResponseSchema: runSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "Invalid payroll run returned by the server." }),
      providesTags: (_result, _error, id) => [{ type, id }],
    }),
    payrollRunPayslips: build.query<z.infer<typeof slipsSchema>, { id: string; page: number; pageSize: number }>({
      query: ({ id, ...params }) => ({ url: `/api/v1/payroll/runs/${encodeURIComponent(id)}/payslips`, params, headers }),
      rawResponseSchema: slipsSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "Invalid payslip list returned by the server." }),
      providesTags: (_result, _error, arg) => [{ type, id: arg.id }],
    }),
    payrollPayslip: build.query<Payslip, string>({
      query: (id) => ({ url: `/api/v1/payroll/payslips/${encodeURIComponent(id)}`, headers }),
      rawResponseSchema: slipSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "Invalid payslip returned by the server." }),
      providesTags: [{ type, id: "LIST" }],
    }),
    createPayrollRun: build.mutation<string, { periodStart: string; periodEnd: string }>({
      query: (body) => ({ url: "/api/v1/payroll/runs", method: "POST", body, headers }),
      rawResponseSchema: z.uuid(),
      invalidatesTags: (_result, error) => (error ? [] : [{ type, id: "LIST" }]),
    }),
    payrollRunCommand: build.mutation<void, { id: string; action: "submit" | "process" | "cancel" }>({
      query: ({ id, action }) => ({ url: `/api/v1/payroll/runs/${encodeURIComponent(id)}/${action}`, method: "POST", headers }),
      invalidatesTags: (_result, error, arg) =>
        error
          ? []
          : [
              { type, id: "LIST" },
              { type, id: arg.id },
            ],
    }),
  }),
});
