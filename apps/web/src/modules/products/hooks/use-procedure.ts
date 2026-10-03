import { productPermissions } from "../lib/product-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdRoutesQuery, usePostApiV1ProductByProductIdRoutesMutation } from "../api/product-api";
import { fromSavedRoutes, toRoutesRequest, type ProcedureStep } from "../lib/procedure";
import { savedRoutesSchema } from "../schemas/procedure-schema";

export const procedureAudit = { module: "Production", subModule: "Procedure" } as const;
const none: ProcedureStep[] = [];

/** A product's procedure. The backend replaces every step on save, so edits are a draft until then. */
export function useProcedure(productId: string) {
  const query = useGetApiV1ProductByProductIdRoutesQuery({ ...procedureAudit, productId });
  const [save, mutation] = usePostApiV1ProductByProductIdRoutesMutation();
  const parsed = useMemo(() => query.isSuccess ? savedRoutesSchema.safeParse(query.data ?? null) : null, [query.isSuccess, query.data]);
  const saved = useMemo(() => parsed?.success ? fromSavedRoutes(parsed.data) : none, [parsed]);
  const [draft, setDraft] = useState<ProcedureStep[] | null>(null);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [productPermissions.edit], departmentType: 0 });
  const steps = draft ?? saved;

  const saveAll = async () => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (steps.length === 0) { setMessage("Add at least one step."); return; }
    const result = await save({ ...procedureAudit, productId, body: toRoutesRequest(steps) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setDraft(null);
    toast.success("Procedure saved");
  };

  return {
    steps, saved,
    dirty: draft !== null,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a procedure the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: mutation.isLoading,
    message,
    setSteps: (next: ProcedureStep[]) => setDraft(next),
    discard: () => { setDraft(null); setMessage(""); },
    saveAll,
  };
}
