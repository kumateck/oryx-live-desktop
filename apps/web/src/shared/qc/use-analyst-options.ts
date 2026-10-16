import { useCallback } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";

/** Anyone who may run a raw material, packaging or product test can be given test fields. */
export const testingPermissions = ["CanStartRawMaterialTest", "CanStartPackagingMaterialTest", "CanStartProductTest"] as const;
const audit = { module: "Quality Control", subModule: "Test Assignment" } as const;

/** People who may be given test work: by default anyone who may run a material or product test. */
export function useAnalystOptions(permissions: readonly string[] = testingPermissions): SelectLoader {
  const [load] = identityApi.useLazyGetApiV1UserByPermissionQuery();
  return useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, permissionKey: [...permissions], searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((user) => user.id && !user.isDisabled ? [{ value: user.id, label: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Analyst" }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load, permissions]);
}
