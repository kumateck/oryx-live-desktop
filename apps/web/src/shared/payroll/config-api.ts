import { z } from "zod";
import { api } from "@/shared/api/base-api";
import {
  gradesSchema,
  bandsSchema,
  pensionsSchema,
  type PayGrade,
  type TaxBand,
  type PensionRate,
  type ConfigCommand,
  type ConfigKind,
} from "./config-contracts";
const headers = { Module: "HR Management", SubModule: "Payroll Configuration" };
export const configPath = (kind: ConfigKind): string => `/api/v1/payroll/${kind === "grade" ? "pay-grades" : kind === "band" ? "tax-bands" : "ssnit-rates"}`;
const family = "PayrollConfiguration" as const;
const enhanced = api.enhanceEndpoints({ addTagTypes: [family] });
/** These existing controller operations are listed as untyped in the OpenAPI backlog. Validate at the transport boundary. */
export const payrollConfigApi = enhanced.injectEndpoints({
  endpoints: (build) => ({
    payrollGrades: build.query<PayGrade[], void>({
      query: () => ({ url: configPath("grade"), headers }),
      rawResponseSchema: gradesSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "The server returned invalid pay grade data." }),
      providesTags: [{ type: family, id: "grade" }],
    }),
    payrollTaxBands: build.query<TaxBand[], void>({
      query: () => ({ url: configPath("band"), headers }),
      rawResponseSchema: bandsSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "The server returned invalid tax band data." }),
      providesTags: [{ type: family, id: "band" }],
    }),
    payrollPensionRates: build.query<PensionRate[], void>({
      query: () => ({ url: configPath("pension"), headers }),
      rawResponseSchema: pensionsSchema,
      catchSchemaFailure: () => ({ status: "CUSTOM_ERROR", error: "The server returned invalid SSNIT rate data." }),
      providesTags: [{ type: family, id: "pension" }],
    }),
    savePayrollConfig: build.mutation<string | void, ConfigCommand>({
      query: (command) => ({
        url: `${configPath(command.kind)}${command.kind === "grade" && command.id ? `/${encodeURIComponent(command.id)}` : ""}`,
        method: command.kind === "grade" && command.id ? "PUT" : "POST",
        body: command.body,
        headers,
      }),
      transformResponse: (response: string | void, _meta, command) => (command.kind === "grade" && command.id ? undefined : z.uuid().parse(response)),
      invalidatesTags: (_result, error, command) => (error ? [] : [{ type: family, id: command.kind }]),
    }),
    deletePayrollConfig: build.mutation<void, { kind: ConfigKind; id: string }>({
      query: ({ kind, id }) => ({ url: `${configPath(kind)}/${encodeURIComponent(id)}`, method: "DELETE", headers }),
      invalidatesTags: (_result, error, command) => (error ? [] : [{ type: family, id: command.kind }]),
    }),
  }),
});
