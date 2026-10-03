import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery,
  usePostApiV1ProductionScheduleFinalPackingMutation, usePostApiV1ProductionScheduleReturnAfterProductionMutation,
} from "../api/activity-api";
import { finalPackingRequest, materialRequests, packingMaterials, returnedMaterials, type MaterialEntry, type YieldFigures, type YieldInputs } from "../lib/final-packing";
import { extraIssuedSchema, issuedPackagingSchema, packingSourceSchema, recordedPackingSchema } from "../schemas/final-packing-schema";

const audit = { module: "Production", subModule: "Final Packing" } as const;
const missing = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);

/** What final packing starts from, and saving it. The packing record is saved first; what is left over is returned to the warehouse after it. */
export function useFinalPacking(batchId: string) {
  const arg = { ...audit, productionScheduleProductId: batchId };
  const recordQuery = useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery(arg);
  const issuedQuery = useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery(arg);
  const extraQuery = useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery(arg);
  const doneQuery = useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery(arg);
  const [savePacking] = usePostApiV1ProductionScheduleFinalPackingMutation();
  const [saveReturns] = usePostApiV1ProductionScheduleReturnAfterProductionMutation();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  /** Set when the packing record was saved but the return was refused, so only the return is sent again. */
  const [pendingReturn, setPendingReturn] = useState<ReturnType<typeof returnedMaterials> | null>(null);

  const source = useMemo(() => { const parsed = packingSourceSchema.safeParse(recordQuery.data ?? null); return parsed.success ? parsed.data : null; }, [recordQuery.data]);
  const issued = useMemo(() => { const parsed = issuedPackagingSchema.safeParse(missing(issuedQuery.error) ? null : issuedQuery.data ?? null); return parsed.success ? parsed.data : []; }, [issuedQuery.data, issuedQuery.error]);
  const extras = useMemo(() => { const parsed = extraIssuedSchema.safeParse(missing(extraQuery.error) ? null : extraQuery.data ?? null); return parsed.success ? parsed.data : []; }, [extraQuery.data, extraQuery.error]);
  const recorded = useMemo(() => { const parsed = recordedPackingSchema.safeParse(missing(doneQuery.error) ? null : doneQuery.data ?? null); return parsed.success ? parsed.data : null; }, [doneQuery.data, doneQuery.error]);
  const materials = useMemo(() => packingMaterials(issued, extras), [issued, extras]);
  const unitIds = useMemo(() => Object.fromEntries(issued.flatMap((item) => item.unitId ? [[item.materialId, item.unitId] as const] : [])), [issued]);
  const failure = (missing(recordQuery.error) ? undefined : recordQuery.error) ?? (missing(issuedQuery.error) ? undefined : issuedQuery.error) ?? (missing(extraQuery.error) ? undefined : extraQuery.error);

  const sendReturn = async (items: ReturnType<typeof returnedMaterials>): Promise<boolean> => {
    if (items.length === 0) return true;
    const result = await saveReturns({ module: "Production", subModule: "Returns", productionScheduleProductId: batchId, body: items });
    if ("error" in result) {
      setPendingReturn(items);
      setMessage(`Final packing was saved, but the leftover materials were not returned to the warehouse: ${apiErrorMessage(result.error)}`);
      return false;
    }
    setPendingReturn(null);
    return true;
  };

  const save = async (input: { stepId: string; batchSize: number; inputs: YieldInputs; figures: YieldFigures; reason: string; entries: Readonly<Record<string, MaterialEntry>> }): Promise<boolean> => {
    if (!source?.packing?.packsPerShipper) return false;
    setMessage(""); setSaving(true);
    try {
      const result = await savePacking({ ...audit, domainEntitiesProductionSchedulesPackingCreateFinalPacking: finalPackingRequest({
        batchId, stepId: input.stepId, packingId: source.packing.id, batchSize: input.batchSize, inputs: input.inputs, figures: input.figures, packsPerShipper: source.packing.packsPerShipper,
        reason: input.reason, materials: materialRequests(materials, input.entries) }) });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
      if (!(await sendReturn(returnedMaterials(materials, input.entries, unitIds)))) return false;
      toast.success("Final packing recorded");
      return true;
    } finally { setSaving(false); }
  };

  const retryReturn = async (): Promise<boolean> => {
    if (!pendingReturn) return true;
    setMessage(""); setSaving(true);
    try { const done = await sendReturn(pendingReturn); if (done) toast.success("Leftover materials returned to the warehouse"); return done; }
    finally { setSaving(false); }
  };

  return {
    source, materials, recorded, pendingReturn: pendingReturn !== null,
    loading: recordQuery.isLoading || issuedQuery.isLoading || extraQuery.isLoading || doneQuery.isLoading,
    error: failure ? apiErrorMessage(failure) : null,
    retry: () => { void recordQuery.refetch(); void issuedQuery.refetch(); void extraQuery.refetch(); void doneQuery.refetch(); },
    saving, message, save, retryReturn,
  };
}
export type FinalPackingState = ReturnType<typeof useFinalPacking>;
