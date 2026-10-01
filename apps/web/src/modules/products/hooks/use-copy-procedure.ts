import { useCallback, useState } from "react";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useSession } from "@/shared/auth/session-provider";
import { useLazyGetApiV1ProductQuery, usePostApiV1ProductByProductIdRoutesMutation } from "../api/product-api";
import { toRoutesRequest, type ProcedureStep } from "../lib/procedure";
import { procedureAudit } from "./use-procedure";

export interface CopyOutcome { product: string; error: string | null }

/** Copies a procedure onto other products of the user's department, and reports what happened to each. */
export function useCopyProcedure(sourceProductId: string) {
  const { state } = useSession();
  const departmentId = state.status === "authenticated" ? state.session.user.departmentId : null;
  const [load] = useLazyGetApiV1ProductQuery();
  const [save] = usePostApiV1ProductByProductIdRoutesMutation();
  const [copying, setCopying] = useState(false);
  const [outcomes, setOutcomes] = useState<CopyOutcome[] | null>(null);

  const loadProducts = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...procedureAudit, searchQuery: search, page, pageSize: 20, ...(departmentId ? { departmentId } : {}) });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((item) => item.id && item.id !== sourceProductId
        ? [{ value: item.id, label: item.code ? `${item.code} - ${item.name ?? ""}` : item.name ?? "Unnamed" }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load, departmentId, sourceProductId]);

  const copy = async (steps: readonly ProcedureStep[], targets: readonly SelectOption[]) => {
    setCopying(true);
    const body = toRoutesRequest(steps, false);
    const results = await Promise.all(targets.map(async (target): Promise<CopyOutcome> => {
      const result = await save({ ...procedureAudit, productId: target.value, body });
      return { product: target.label, error: "error" in result ? apiErrorMessage(result.error) : null };
    }));
    setOutcomes(results);
    setCopying(false);
    return results;
  };

  return { loadProducts, copy, copying, outcomes, clearOutcomes: () => setOutcomes(null) };
}
