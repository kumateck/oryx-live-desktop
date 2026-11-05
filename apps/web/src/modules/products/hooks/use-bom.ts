import { useProductWorkspace } from "./use-product-workspace";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdBomQuery, useLazyGetApiV1MaterialByMaterialIdUomQuery, usePostApiV1BomMutation, usePutApiV1ProductByProductIdBomArchiveMutation } from "../api/product-api";
import { bomProblems, fromSavedBom, toBomRequest, type BomLine } from "../lib/bom";
import { savedBomSchema } from "../schemas/bom-schema";
import { materialUnitSchema } from "../lib/material-unit";

export const bomAudit = { module: "Production", subModule: "Bill of Materials" } as const;
const none: BomLine[] = [];

/**
 * A product's active bill of materials. The backend stores a saved formula as a new version, so
 * edits are kept here as a draft until the user saves.
 */
export function useBom(productId: string, compositionSize: number | null, batchSize: number | null) {
  const query = useGetApiV1ProductByProductIdBomQuery({ ...bomAudit, productId });
  const [save, saving] = usePostApiV1BomMutation();
  const [archive, archiving] = usePutApiV1ProductByProductIdBomArchiveMutation();
  const [loadUnit] = useLazyGetApiV1MaterialByMaterialIdUomQuery();
  const [preparing, setPreparing] = useState(false);
  const savingNow = useRef(false);
  // A product with no formula answers with an empty body or 404; both mean "none yet".
  const missing = Boolean(query.error && "status" in query.error && query.error.status === 404);
  const parsed = useMemo(() => query.isSuccess ? savedBomSchema.safeParse(query.data ?? null) : null, [query.isSuccess, query.data]);
  const saved = useMemo(() => parsed?.success ? fromSavedBom(parsed.data) : none, [parsed]);
  const [draft, setDraft] = useState<BomLine[] | null>(null);
  const [message, setMessage] = useState("");
  const { save: saveRequirement, task, keys, context, lookupProductId } = useProductWorkspace();
  const permission = usePermissionAction(saveRequirement("bom"));
  const archivePermission = usePermissionAction(task(keys.sections.bom.archive ?? keys.sections.bom.edit));
  const lines = draft ?? saved;

  const saveAll = async () => {
    if (savingNow.current) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (!lines.length) { setMessage(bomProblems(lines).join(" ")); return; }
    savingNow.current = true;
    setPreparing(true);
    try {
      // Recheck all linkage units before writing, including unchanged rows with a stale saved BOM unit.
      const checked = await Promise.all(lines.map(async (line) => {
        const result = await loadUnit({ ...bomAudit, materialId: line.material.value, ...(lookupProductId ? { productId: lookupProductId } : {}) });
        const parsed = materialUnitSchema.safeParse(result.data);
        return { line, unit: parsed.success ? parsed.data : null };
      }));
      const missing = checked.filter((item) => !item.unit).map((item) => item.line.material.label);
      if (missing.length) { setMessage(`Could not verify the department-linked unit for: ${missing.join(", ")}. Retry before saving.`); return; }
      const changed = checked.filter(({ line, unit }) => line.linkedUnit && unit
        && (line.linkedUnit.id !== unit.id || line.linkedUnit.symbol.toLowerCase() !== unit.symbol.toLowerCase()));
      if (changed.length) { setMessage("A department-linked unit changed while this BOM was being edited. Reload and review the quantities before saving."); return; }
      const verified = checked.flatMap(({ line, unit }) => unit ? [{ ...line, unit, linkedUnit: unit }] : []);
      const revoked = permission.check();
      if (revoked) { setMessage(revoked); return; }
      const result = await save({ ...bomAudit, ...context, domainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest: toBomRequest(productId, verified, compositionSize, batchSize) });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      setDraft(null);
      toast.success("Bill of materials saved");
    } finally {
      savingNow.current = false;
      setPreparing(false);
    }
  };
  const archiveActive = async () => {
    const denied = archivePermission.check();
    if (denied) { setMessage(denied); return false; }
    setMessage("");
    const result = await archive({ ...bomAudit, ...context, productId });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
    setDraft(null);
    toast.success("Bill of materials archived");
    return true;
  };

  return {
    lines,
    version: parsed?.success ? parsed.data?.version ?? null : null,
    hasSaved: saved.length > 0,
    dirty: draft !== null,
    loading: query.isLoading,
    error: missing ? null : query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a bill of materials the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: saving.isLoading || preparing,
    archiving: archiving.isLoading,
    message,
    setLines: (next: BomLine[]) => setDraft(next),
    discard: () => { setDraft(null); setMessage(""); },
    saveAll,
    archiveActive,
  };
}
