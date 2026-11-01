import { useMemo } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import { useCurrentUser } from "@/shared/auth/session-provider";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";

const audit = { module: "Settings", subModule: "Configurations" } as const;
const Production = 0;

/** Production departments to choose from; someone in a department may upload only for their own. */
export function useDepartments() {
  const user = useCurrentUser();
  const own = user?.departmentId ? { value: user.departmentId, label: user.department ?? "Your department" } : null;
  const [load] = identityApi.useLazyGetApiV1DepartmentQuery();
  const loadOptions = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = load({ ...audit, type: Production, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name ?? "Department" }] : []), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [load]);
  return { own, loadOptions };
}
