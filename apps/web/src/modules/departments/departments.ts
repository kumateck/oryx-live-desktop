import { z } from "zod";
import { identityApi } from "@/shared/api/generated/identity";

export const departmentPermissions = { view: "CanViewDepartments", add: "CanCreateNewDepartment", edit: "CanEditDepartment", remove: "CanDeleteDepartment" } as const;
export const departmentAudit = { module: "Settings", subModule: "Departments" } as const;
/** The numbers are the server's. */
export const departmentTypes = [{ value: "0", label: "Production" }, { value: "1", label: "Non production" }] as const;
export const departmentTypeLabel = (type: number) => departmentTypes.find((item) => item.value === String(type))?.label ?? "Other";

const list = { type: "Departments" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
export const departmentApi = identityApi.enhanceEndpoints({ endpoints: { getApiV1Department: { providesTags: [list] }, postApiV1Department: { invalidatesTags: changed },
  putApiV1DepartmentByDepartmentId: { invalidatesTags: changed }, deleteApiV1DepartmentByDepartmentId: { invalidatesTags: changed } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
export const departmentRowsSchema = z.array(z.object({ id: z.string().nullish(), code: text, name: text, description: text, type: z.number().nullish(), division: z.union([z.literal(0), z.literal(1)]).nullish().catch(null),
  parentDepartment: z.object({ id: z.string().nullish(), name: text }).nullish() })).nullish()
  .transform((rows) => (rows ?? []).flatMap((row) => row.id ? [{ id: row.id, code: row.code ?? "", name: row.name ?? "Unnamed department", description: row.description, type: row.type ?? 0, division: row.division ?? null,
    parent: row.parentDepartment?.id ? { value: row.parentDepartment.id, label: row.parentDepartment.name ?? "Unnamed department" } : null }] : []));
export type Department = z.infer<typeof departmentRowsSchema>[number];

export const departmentFormSchema = z.object({
  code: z.string().trim().min(1, "Enter the department code").max(50, "Keep the code under 50 characters"),
  name: z.string().trim().min(1, "Enter the department name").max(255, "Keep the name under 255 characters"),
  type: z.string().min(1, "Choose the department type"),
  parent: z.object({ value: z.string(), label: z.string() }).nullable(),
  description: z.string().nullish(),
});
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

/** A department code starts with the configured prefix and the first letter of the department's name. */
export const codePrefix = (prefix: string | null | undefined, name: string) => `${prefix ?? ""}${name.trim().charAt(0).toUpperCase()}`;
/** A department cannot be its own parent. */
export const parentChoices = (departments: readonly Department[], self: string | null) => departments.filter((item) => item.id !== self).map((item) => ({ value: item.id, label: item.name }));
