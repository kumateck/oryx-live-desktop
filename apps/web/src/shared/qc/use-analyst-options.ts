import { useCallback, useEffect, useState } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";

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

/** Loads every eligible analyst once so a form can filter the complete set locally. */
export function useAnalystDirectory() {
  const [load] = identityApi.useLazyGetApiV1UserByPermissionQuery();
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    const requests: ReturnType<typeof load>[] = [];
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      const users: SelectOption[] = [];
      let page = 1;
      let pageCount = 1;
      while (page <= pageCount) {
        const request = load({ ...audit, permissionKey: [...testingPermissions], page, pageSize: 200 });
        requests.push(request);
        const result = await request;
        if (!active) return;
        if (result.isError) {
          setError(apiErrorMessage(result.error));
          setLoading(false);
          return;
        }
        const response = result.data;
        if (!response) {
          setError("The server returned no analyst records.");
          setLoading(false);
          return;
        }
        users.push(...(response.data ?? []).flatMap((user) => user.id && !user.isDisabled
          ? [{ value: user.id, label: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Analyst" }]
          : []));
        pageCount = response.pageCount ?? page;
        page += 1;
      }
      setOptions(users);
      setLoading(false);
    };
    void fetchAll();
    return () => { active = false; requests.forEach((request) => request.abort()); };
  }, [load, revision]);

  return { options, loading, error, retry: () => setRevision((value) => value + 1) };
}
