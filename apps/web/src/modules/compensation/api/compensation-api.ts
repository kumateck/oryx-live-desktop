import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { readAllPages } from "@/shared/api/read-all-pages";
import {
  compensationSchema,
  historySchema,
  additionPage,
  deductionPage,
  reliefSchema,
  type Compensation,
  type CompensationBody,
  type AdjustmentKind,
  type Adjustment,
  type AdjustmentBody,
} from "../schemas/contracts";
const headers = { Module: "HR Management", SubModule: "Employee Compensation" };
const path = (kind: AdjustmentKind): string => `/api/v1/payroll/${kind === "addition" ? "additions" : kind === "deduction" ? "deductions" : "tax-reliefs"}`;
const tag = "EmployeeCompensation" as const;
export const compensationApi = api.enhanceEndpoints({ addTagTypes: [tag] }).injectEndpoints({
  endpoints: (build) => ({
    employeeCompensation: build.query<Compensation, string>({
      query: (id) => ({ url: `/api/v1/payroll/compensation/${encodeURIComponent(id)}`, headers }),
      rawResponseSchema: compensationSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "Invalid compensation record returned by the server." }),
      providesTags: (_result, _error, id) => [{ type: tag, id }],
    }),
    compensationHistory: build.query<z.infer<typeof historySchema>, { employeeId: string; page: number; pageSize: number }>({
      query: ({ employeeId, ...params }) => ({ url: `/api/v1/payroll/compensation/${encodeURIComponent(employeeId)}/history`, params, headers }),
      rawResponseSchema: historySchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "Invalid compensation history returned by the server." }),
      providesTags: (_result, _error, arg) => [{ type: tag, id: arg.employeeId }],
    }),
    saveEmployeeCompensation: build.mutation<string, CompensationBody>({
      query: (body) => ({ url: "/api/v1/payroll/compensation", method: "POST", body, headers }),
      rawResponseSchema: z.uuid(),
      invalidatesTags: (_result, error, arg) => (error ? [] : [{ type: tag, id: arg.employeeId }]),
    }),
    compensationAdjustments: build.query<Adjustment[], { employeeId: string; kind: AdjustmentKind }>({
      async queryFn({ employeeId, kind }, context, _extra, baseQuery) {
        try {
          if (kind === "relief") {
            const result = await baseQuery({ url: `${path(kind)}/${encodeURIComponent(employeeId)}`, headers });
            if (result.error) return { error: result.error };
            const rows = z.array(reliefSchema).parse(result.data);
            if (rows.some((row) => row.employeeId !== employeeId) || new Set(rows.map((row) => row.id)).size !== rows.length)
              throw new Error("Invalid relief identity or employee scope.");
            return { data: rows.map((row) => ({ ...row, description: "", amount: row.annualAmount, isTaxable: null, isRecurring: null })) };
          }
          const rows = await readAllPages<Adjustment>(
            async (page) => {
              const result = await baseQuery({ url: path(kind), params: { employeeId, page, pageSize: 100 }, headers });
              if (result.error) throw new Error("Could not read every adjustment page. Retry before taking action.");
              if (kind === "addition") return additionPage.parse(result.data);
              const value = deductionPage.parse(result.data);
              return { ...value, data: value.data.map((row) => ({ ...row, isTaxable: null })) };
            },
            (row) => row.id,
            context.signal,
          );
          if (rows.some((row) => row.employeeId !== employeeId)) throw new Error("The server returned another employee's adjustments.");
          return { data: rows };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error instanceof Error ? error.message : "The adjustments could not be verified." } };
        }
      },
      providesTags: (_result, _error, arg) => [{ type: tag, id: `${arg.employeeId}:${arg.kind}` }],
    }),
    createCompensationAdjustment: build.mutation<string, { kind: AdjustmentKind; body: AdjustmentBody }>({
      query: ({ kind, body }) => ({
        url: path(kind),
        method: "POST",
        body:
          kind === "relief"
            ? {
                employeeId: body.employeeId,
                type: body.type,
                annualAmount: body.annualAmount,
                effectiveFrom: body.effectiveFrom,
                effectiveTo: body.effectiveTo,
              }
            : body,
        headers,
      }),
      rawResponseSchema: z.uuid(),
      invalidatesTags: (_result, error, arg) => (error ? [] : [{ type: tag, id: `${arg.body.employeeId}:${arg.kind}` }]),
    }),
    deleteCompensationAdjustment: build.mutation<void, { kind: AdjustmentKind; id: string; employeeId: string }>({
      query: ({ kind, id }) => ({ url: `${path(kind)}/${encodeURIComponent(id)}`, method: "DELETE", headers }),
      invalidatesTags: (_result, error, arg) => (error ? [] : [{ type: tag, id: `${arg.employeeId}:${arg.kind}` }]),
    }),
  }),
});
