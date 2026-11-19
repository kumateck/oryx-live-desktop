import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery,
  useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery, usePostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdMutation,
} from "../api/schedule-api";
import { shortFirst, shortLines, substitutesOf } from "../lib/batch-materials";
import { audit, schedulePermissions } from "../lib/schedule-access";
import { batchActivitySchema, batchMaterialsSchema } from "../schemas/batch-schema";

const activityAudit = { module: "Production", subModule: "Activities" } as const;
const notFound = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);

/** One batch's materials and production run. */
export function useBatch(batchId: string) {
  const arg = { ...audit, productionScheduleProductId: batchId };
  const raw = useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery(arg);
  const packaging = useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery(arg);
  const activityQuery = useGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery(arg);
  const [startBatch, starting] = usePostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdMutation();
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [schedulePermissions.start], departmentType: 0 });

  const rawRows = useMemo(() => { const parsed = batchMaterialsSchema.safeParse(raw.data ?? null); return parsed.success ? shortFirst(parsed.data) : null; }, [raw.data]);
  const packagingRows = useMemo(() => { const parsed = batchMaterialsSchema.safeParse(packaging.data ?? null); return parsed.success ? shortFirst(parsed.data) : null; }, [packaging.data]);
  // A batch that has not started has no production run; the server answers with nothing or "not found".
  const activity = useMemo(() => { const parsed = batchActivitySchema.safeParse(notFound(activityQuery.error) ? null : activityQuery.data ?? null); return parsed.success ? parsed.data : null; },
    [activityQuery.data, activityQuery.error]);
  const loaded = raw.isSuccess && packaging.isSuccess && rawRows !== null && packagingRows !== null;
  // For a line with substitutes, the material production will use: the main material unless a substitute is chosen.
  const [choices, setChoices] = useState<ReadonlyMap<string, string>>(new Map());
  const choose = (mainId: string, useId: string) => setChoices((current) => new Map(current).set(mainId, useId));
  // Only raw material has to be in stock to start; packaging is requested during production, up to final packing.
  const short = loaded ? shortLines(rawRows, choices).length : null;
  const packagingShort = loaded ? shortLines(packagingRows, choices).length : null;
  /** Every line that has substitutes, raw first: what the start dialog offers a choice for. */
  const choosable = loaded ? [...rawRows, ...packagingRows].filter((item) => !item.substituteFor && substitutesOf(item, [...rawRows, ...packagingRows]).length > 0) : [];

  const start = async (): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    setMessage("");
    // Every line with substitutes is sent, so the server reserves exactly what was shown: main by default.
    const materialChoices = choosable.flatMap((main) => main.materialId ? [{ materialId: main.materialId, useMaterialId: choices.get(main.materialId) ?? main.materialId }] : []);
    const result = await startBatch({ ...activityAudit, productionScheduleProductId: batchId,
      domainEntitiesProductionSchedulesStartProductionRequest: { materialChoices } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
    toast.success("Production started");
    return true;
  };

  const unreadable = "The server returned materials the app could not read.";
  return {
    raw: { rows: rawRows ?? [], loading: raw.isLoading, error: raw.error ? apiErrorMessage(raw.error) : raw.isSuccess && !rawRows ? unreadable : null, retry: () => { void raw.refetch(); } },
    packaging: { rows: packagingRows ?? [], loading: packaging.isLoading, error: packaging.error ? apiErrorMessage(packaging.error) : packaging.isSuccess && !packagingRows ? unreadable : null,
      retry: () => { void packaging.refetch(); } },
    activity, activityLoading: activityQuery.isLoading,
    /** How many raw materials are short, or null until both lists have loaded; production must not start on a guess. */
    short,
    /** Packaging that is short does not hold up the start, but production cannot be packed without it. */
    packagingShort,
    start, starting: starting.isLoading, message,
    /** Lines with substitutes, the choice for each, and how to change it. */
    choosable, choices, choose,
    allRows: [...(rawRows ?? []), ...(packagingRows ?? [])],
  };
}
export type BatchData = ReturnType<typeof useBatch>;
