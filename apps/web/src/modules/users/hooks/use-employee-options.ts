import { useCallback, useRef } from "react";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { useLazyGetApiV1EmployeeQuery } from "../api/user-api";
import { audit } from "../lib/user-access";
import { employeeOptionSchema, type EmployeeOption } from "../schemas/user-schema";

const activeEmployee = 0;

/** Searches active employees who do not have a user account yet, for the employee picker. */
export function useEmployeeOptions() {
  const [load] = useLazyGetApiV1EmployeeQuery();
  // Details of every employee offered so far, so the form can show the chosen one's email and department.
  const seen = useRef(new Map<string, EmployeeOption>());

  const loadOptions = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20, status: activeEmployee, isNotUser: true });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const employees = (result.data ?? []).flatMap((item) => {
      const parsed = employeeOptionSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
    for (const employee of employees) seen.current.set(employee.id, employee);
    const current = result.pageIndex ?? page;
    return {
      options: employees.map((employee) => ({ value: employee.id, label: employee.name })),
      hasNext: current < (result.pageCount ?? current),
      hasPrevious: current > 1,
    };
  }, [load]);

  return { loadOptions, employeeById: (id: string | undefined) => id ? seen.current.get(id) ?? null : null };
}
