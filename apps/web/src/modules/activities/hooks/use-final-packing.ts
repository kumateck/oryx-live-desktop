import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery,
  usePostApiV1ProductionScheduleFinalPackingMutation, usePostApiV1ProductionScheduleReturnAfterProductionMutation,
  useGetApiV1ProductionScheduleActivityByProductionActivityIdQuery,
} from "../api/activity-api";
import { finalPackingRequest, materialRequests, packingMaterials, packingProblem, packCategory, returnedMaterials, yieldFigures, yieldTerms, type MaterialEntry, type YieldFigures, type YieldInputs } from "../lib/final-packing";
import { activityAudit } from "../lib/activity-access";
import { activitySchema, type Activity } from "../schemas/activity-schema";
import { stepPolicy } from "../lib/step-policy";
import { extraIssuedSchema, issuedPackagingSchema, packingSourceSchema, recordedPackingSchema } from "../schemas/final-packing-schema";

const audit = { module: "Production", subModule: "Final Packing" } as const;
const missing = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);

/** What final packing starts from, and saving it. The packing record is saved first; what is left over is returned to the warehouse after it. */
export function useFinalPacking(batchId: string, activity: Activity) {
  const permission = usePermissionAction({ kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 });
  const user = useCurrentUser();
  const activityQuery = useGetApiV1ProductionScheduleActivityByProductionActivityIdQuery({ ...activityAudit, productionActivityId: activity.id });
  const arg = { ...audit, productionScheduleProductId: batchId };
  const recordQuery = useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery(arg);
  const issuedQuery = useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery(arg);
  const extraQuery = useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery(arg);
  const doneQuery = useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery(arg);
  const [savePacking] = usePostApiV1ProductionScheduleFinalPackingMutation();
  const [saveReturns] = usePostApiV1ProductionScheduleReturnAfterProductionMutation();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const created = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const [completed, setCompleted] = useState(false);
  /** Set when the packing record was saved but the return was refused, so only the return is sent again. */
  const [pendingReturn, setPendingReturn] = useState<ReturnType<typeof returnedMaterials> | null>(null);

  const source = useMemo(() => { const parsed = packingSourceSchema.safeParse(recordQuery.data ?? null); return parsed.success ? parsed.data : null; }, [recordQuery.data]);
  const issued = useMemo(() => { const parsed = issuedPackagingSchema.safeParse(missing(issuedQuery.error) ? null : issuedQuery.data ?? null); return parsed.success ? parsed.data : []; }, [issuedQuery.data, issuedQuery.error]);
  const extras = useMemo(() => { const parsed = extraIssuedSchema.safeParse(missing(extraQuery.error) ? null : extraQuery.data ?? null); return parsed.success ? parsed.data : []; }, [extraQuery.data, extraQuery.error]);
  const recorded = useMemo(() => { const parsed = recordedPackingSchema.safeParse(missing(doneQuery.error) ? null : doneQuery.data ?? null); return parsed.success ? parsed.data : null; }, [doneQuery.data, doneQuery.error]);
  const materials = useMemo(() => packingMaterials(issued, extras), [issued, extras]);
  const unitIds = useMemo(() => Object.fromEntries(issued.flatMap((item) => item.unitId ? [[item.materialId, item.unitId] as const] : [])), [issued]);
  const failure = recordQuery.error ?? (missing(issuedQuery.error) ? undefined : issuedQuery.error) ?? (missing(extraQuery.error) ? undefined : extraQuery.error) ?? (missing(doneQuery.error) ? undefined : doneQuery.error);
  const malformed = (!recordQuery.isLoading && !source)
    || (!issuedQuery.error && issuedQuery.data != null && !issuedPackagingSchema.safeParse(issuedQuery.data).success)
    || (!extraQuery.error && extraQuery.data != null && !extraIssuedSchema.safeParse(extraQuery.data).success)
    || (!doneQuery.error && doneQuery.data != null && !recordedPackingSchema.safeParse(doneQuery.data).success);
  const unaccounted = extras.some((extra) => extra.quantity > 0 && !issued.some((item) => item.materialId === extra.materialId));
  const inconsistentUnits = issued.some((item) => issued.some((other) => other.materialId === item.materialId && (other.unitId !== item.unitId || other.unit !== item.unit)))
    || extras.some((extra) => extra.unitId && issued.some((item) => item.materialId === extra.materialId && item.unitId !== extra.unitId));
  const error = failure ? apiErrorMessage(failure) : malformed ? "The server returned packing data the app could not validate. Reload before recording packing."
    : unaccounted ? "Extra packaging materials do not match the issued requisition. Reconcile the issued materials before recording packing."
      : inconsistentUnits ? "An issued material has conflicting units of measure. Correct the requisition before recording packing." : null;

  // A timeout, failed connection, or server error may occur after the server committed the write.
  const ambiguous = (failure: object) => !("status" in failure && typeof failure.status === "number" && failure.status >= 400 && failure.status < 500);

  const sendReturn = async (items: ReturnType<typeof returnedMaterials>): Promise<boolean> => {
    if (items.length === 0) return true;
    setPendingReturn(items);
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    const result = await saveReturns({ module: "Production", subModule: "Returns", productionScheduleProductId: batchId, body: items });
    if ("error" in result) {
      const unconfirmed = Boolean(result.error && ambiguous(result.error));
      if (unconfirmed) setUncertain(true);
      setMessage(`Final packing was saved, but ${unconfirmed ? "the return request has no confirmed outcome" : "the return of leftover materials was refused"}: ${apiErrorMessage(result.error)}`);
      return false;
    }
    setPendingReturn(null);
    return true;
  };

  const save = async (input: { stepId: string; batchSize: number; inputs: YieldInputs; figures: YieldFigures; reason: string; entries: Readonly<Record<string, MaterialEntry>> }): Promise<boolean> => {
    if (busy.current || created.current || uncertain || pendingReturn || recorded) return false;
    const denied = permission.check();
    if (denied || error) { setMessage(denied ?? error ?? "Packing data could not be verified."); return false; }
    if (!source?.packing?.packsPerShipper) { setMessage("The packing style must have a valid number of packs per shipper."); return false; }
    const category = packCategory(source.packing.unitName);
    if (!category) { setMessage("The packing category is missing or unsupported. Correct the packing style before saving."); return false; }
    const figures = yieldFigures(input.inputs, { category, receivedUnit: yieldTerms(category, activity.batch.unit).receivedUnit,
      packingExpectedYield: source.packing.expectedYield, packsPerShipper: source.packing.packsPerShipper });
    const problem = packingProblem({ ...input, figures, packsPerShipper: source.packing.packsPerShipper, materials, unitIds });
    if (problem) { setMessage(problem); return false; }
    busy.current = true;
    setMessage(""); setSaving(true);
    let writeStarted = false;
    try {
      const [latestActivity, latestPacking, latestIssued, latestExtra, latestDone] = await Promise.all([
        activityQuery.refetch(), recordQuery.refetch(), issuedQuery.refetch(), extraQuery.refetch(), doneQuery.refetch(),
      ]);
      const readFailure = latestActivity.error ?? latestPacking.error ?? (missing(latestIssued.error) ? undefined : latestIssued.error)
        ?? (missing(latestExtra.error) ? undefined : latestExtra.error) ?? (missing(latestDone.error) ? undefined : latestDone.error);
      if (readFailure) { setMessage(apiErrorMessage(readFailure)); return false; }
      const fresh = activitySchema.safeParse(latestActivity.data);
      const step = fresh.success ? fresh.data.steps.find((step) => step.id === input.stepId) : null;
      if (!fresh.success || fresh.data.batch.id !== batchId || !step || !stepPolicy({ step, currentStepId: fresh.data.currentStepId,
        cancelled: fresh.data.batch.cancelled, userId: user?.id ?? null, extraMaterialPending: false, atrExists: false }).canFinalPack) {
        setMessage("The active step or your assignment has changed. Return to the batch and review its current state."); return false;
      }
      if (latestDone.data != null) { setMessage("Final packing has already been recorded. Reload to view it."); return false; }
      if (JSON.stringify(latestPacking.data) !== JSON.stringify(recordQuery.data) || JSON.stringify(latestIssued.data) !== JSON.stringify(issuedQuery.data)
        || JSON.stringify(latestExtra.data) !== JSON.stringify(extraQuery.data) || fresh.data.batch.quantity !== activity.batch.quantity || fresh.data.batch.unit !== activity.batch.unit) {
        setMessage("The packing style or issued quantities changed. Review the updated figures before saving again."); return false;
      }
      const accessChanged = permission.check();
      if (accessChanged) { setMessage(accessChanged); return false; }
      writeStarted = true;
      const result = await savePacking({ ...audit, domainEntitiesProductionSchedulesPackingCreateFinalPacking: finalPackingRequest({
        batchId, stepId: input.stepId, packingId: source.packing.id, batchSize: input.batchSize, inputs: input.inputs, packsPerShipper: source.packing.packsPerShipper,
        figures, reason: input.reason, materials: materialRequests(materials, input.entries) }) });
      if ("error" in result) { if (result.error && ambiguous(result.error)) setUncertain(true); setMessage(apiErrorMessage(result.error)); return false; }
      created.current = true;
      if (!(await sendReturn(returnedMaterials(materials, input.entries, unitIds)))) return false;
      setCompleted(true);
      toast.success("Final packing recorded");
      return true;
    } catch {
      if (writeStarted) setUncertain(true);
      setMessage(writeStarted ? "The request ended without a confirmed response." : "The latest packing data could not be verified. Retry before saving.");
      return false;
    } finally { busy.current = false; setSaving(false); }
  };

  const retryReturn = async (): Promise<boolean> => {
    if (busy.current || uncertain) return false;
    if (!pendingReturn) return true;
    busy.current = true;
    setMessage(""); setSaving(true);
    try { const done = await sendReturn(pendingReturn); if (done) { setCompleted(true); toast.success("Leftover materials returned to the warehouse"); } return done; }
    catch { setUncertain(true); setMessage("The return request ended without a confirmed response."); return false; }
    finally { busy.current = false; setSaving(false); }
  };

  return {
    source, materials, recorded, pendingReturn: pendingReturn !== null,
    loading: recordQuery.isLoading || issuedQuery.isLoading || extraQuery.isLoading || doneQuery.isLoading,
    error,
    retry: () => { void recordQuery.refetch(); void issuedQuery.refetch(); void extraQuery.refetch(); void doneQuery.refetch(); },
    saving, message, save, retryReturn, uncertain, completed,
  };
}
export type FinalPackingState = ReturnType<typeof useFinalPacking>;
