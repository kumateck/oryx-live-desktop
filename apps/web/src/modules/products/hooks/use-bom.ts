import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdBomQuery, usePostApiV1BomMutation, usePutApiV1ProductByProductIdBomArchiveMutation } from "../api/product-api";
import { bomProblems, fromSavedBom, toBomRequest, type BomLine } from "../lib/bom";
import { savedBomSchema } from "../schemas/bom-schema";

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
  // A product with no formula answers with an empty body or 404; both mean "none yet".
  const missing = Boolean(query.error && "status" in query.error && query.error.status === 404);
  const parsed = useMemo(() => query.isSuccess ? savedBomSchema.safeParse(query.data ?? null) : null, [query.isSuccess, query.data]);
  const saved = useMemo(() => parsed?.success ? fromSavedBom(parsed.data) : none, [parsed]);
  const [draft, setDraft] = useState<BomLine[] | null>(null);
  const [message, setMessage] = useState("");
  const lines = draft ?? saved;
  const problems = bomProblems(lines);

  const saveAll = async () => {
    setMessage("");
    if (problems.length) { setMessage(problems.join(" ")); return; }
    const result = await save({ ...bomAudit, domainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest: toBomRequest(productId, lines, compositionSize, batchSize) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setDraft(null);
    toast.success("Bill of materials saved");
  };
  const archiveActive = async () => {
    setMessage("");
    const result = await archive({ ...bomAudit, productId });
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
    saving: saving.isLoading,
    archiving: archiving.isLoading,
    message,
    setLines: (next: BomLine[]) => setDraft(next),
    discard: () => { setDraft(null); setMessage(""); },
    saveAll,
    archiveActive,
  };
}
