import { useCallback, useState } from "react";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useLazyGetApiV1ProductQuery, usePostApiV1ProductByProductIdRoutesMutation } from "../api/product-api";
import { productPermissions } from "../lib/product-access";
import { toRoutesRequest, type ProcedureStep } from "../lib/procedure";
import { procedureAudit } from "./use-procedure";

export interface CopyOutcome { product: string; error: string | null }

/** Copies a procedure onto selected products in one chosen department, and reports each result. */
export function useCopyProcedure(sourceProductId: string) {
  const [load] = useLazyGetApiV1ProductQuery();
  const [save] = usePostApiV1ProductByProductIdRoutesMutation();
  const permission = usePermissionAction({ kind: "all", permissions: [productPermissions.edit], departmentType: 0 });
  const [copying, setCopying] = useState(false);
  const [outcomes, setOutcomes] = useState<CopyOutcome[] | null>(null);

  const loadProducts = useCallback((departmentId: string | null): SelectLoader => async (search, page, signal) => {
    if (!departmentId) return { options: [], hasNext: false, hasPrevious: false };
    const request = load({ ...procedureAudit, searchQuery: search, page, pageSize: 20, departmentId });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((item) => item.id && item.id !== sourceProductId
        ? [{ value: item.id, label: item.code ? `${item.code} · ${item.name ?? "Unnamed"}` : item.name ?? "Unnamed" }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load, sourceProductId]);

  const copy = async (steps: readonly ProcedureStep[], targets: readonly SelectOption[]) => {
    setCopying(true);
    const body = toRoutesRequest(steps, false);
    const results = await Promise.all(targets.map(async (target): Promise<CopyOutcome> => {
      const denied = permission.check();
      if (denied) return { product: target.label, error: denied };
      const result = await save({ ...procedureAudit, productId: target.value, body });
      return { product: target.label, error: "error" in result ? apiErrorMessage(result.error) : null };
    }));
    setOutcomes(results);
    setCopying(false);
    return results;
  };

  const copyToCurrent = async (steps: readonly ProcedureStep[]) => {
    setCopying(true);
    const denied = permission.check();
    if (denied) {
      const result = [{ product: sourceProductId, error: denied }];
      setOutcomes(result);
      setCopying(false);
      return result;
    }
    const response = await save({ ...procedureAudit, productId: sourceProductId, body: toRoutesRequest(steps, false) });
    const result = [{ product: sourceProductId, error: "error" in response ? apiErrorMessage(response.error) : null }];
    setOutcomes(result);
    setCopying(false);
    return result;
  };

  return { loadProducts, copy, copyToCurrent, copying, outcomes, clearOutcomes: () => setOutcomes(null) };
}
