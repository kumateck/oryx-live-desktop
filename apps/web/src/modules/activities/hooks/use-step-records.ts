import { useMemo } from "react";
import {
  useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery,
  useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery,
} from "../api/activity-api";
import { activityAudit } from "../lib/activity-access";
import { extraMaterialStatus } from "../lib/step-status";
import { atrStateSchema, bmrStateSchema, extraMaterialsSchema, requisitionStateSchema } from "../schemas/activity-schema";

const missing = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);

/**
 * The records a step's actions depend on. Each is requested only when the step has the action it
 * belongs to, and only for the batch's current step, so a board of fifteen steps asks for a
 * handful of records, not fifteen sets.
 */
export function useStepRecords({ batchId, stepId, enabled, needs }: {
  batchId: string | null; stepId: string; enabled: boolean;
  needs: { stockRequisition: boolean; bmr: boolean; atr: boolean };
}) {
  const arg = { ...activityAudit, productionScheduleProductId: batchId ?? "" };
  const off = !enabled || !batchId;
  const extra = useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery(arg, { skip: off });
  const bmr = useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery(arg, { skip: off || !(needs.bmr || needs.atr) });
  const raw = useGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery(arg, { skip: off || !needs.stockRequisition });
  const packaging = useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery(arg, { skip: off || !needs.stockRequisition });
  const atr = useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery({ ...activityAudit, activityStepId: stepId }, { skip: !enabled || !needs.atr });

  return useMemo(() => {
    // "Not found" means the record has not been made yet, which is an answer, not a failure.
    const read = <T,>(query: { data?: object | null | undefined; error?: object | undefined }, parse: (value: object | null) => T): T => parse(missing(query.error) ? null : query.data ?? null);
    const extras = extraMaterialsSchema.safeParse(missing(extra.error) ? null : extra.data ?? null);
    const statuses = extras.success ? extras.data : [];
    return {
      extraMaterialPending: statuses.includes(extraMaterialStatus.pending),
      extraMaterialOpen: statuses.some((status) => status !== extraMaterialStatus.approved),
      bmr: read(bmr, (value) => { const result = bmrStateSchema.safeParse(value); return result.success ? result.data : null; }),
      rawRequisition: read(raw, (value) => { const result = requisitionStateSchema.safeParse(value); return result.success ? result.data : null; }),
      packagingRequisition: read(packaging, (value) => { const result = requisitionStateSchema.safeParse(value); return result.success ? result.data : null; }),
      atr: read(atr, (value) => { const result = atrStateSchema.safeParse(value); return result.success ? result.data : null; }),
      loading: extra.isLoading || bmr.isLoading || raw.isLoading || packaging.isLoading || atr.isLoading,
    };
  }, [extra.data, extra.error, extra.isLoading, bmr, raw, packaging, atr]);
}
export type StepRecords = ReturnType<typeof useStepRecords>;
