import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery,
  useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery, usePostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdMutation,
} from "../api/schedule-api";
import { materialCovered, shortFirst } from "../lib/batch-materials";
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
  const permission = usePermissionAction({ kind: "all", permissions: [schedulePermissions.view], departmentType: 0 });

  const rawRows = useMemo(() => { const parsed = batchMaterialsSchema.safeParse(raw.data ?? null); return parsed.success ? shortFirst(parsed.data) : null; }, [raw.data]);
  const packagingRows = useMemo(() => { const parsed = batchMaterialsSchema.safeParse(packaging.data ?? null); return parsed.success ? shortFirst(parsed.data) : null; }, [packaging.data]);
  // A batch that has not started has no production run; the server answers with nothing or "not found".
  const activity = useMemo(() => { const parsed = batchActivitySchema.safeParse(notFound(activityQuery.error) ? null : activityQuery.data ?? null); return parsed.success ? parsed.data : null; },
    [activityQuery.data, activityQuery.error]);
  const loaded = raw.isSuccess && packaging.isSuccess && rawRows !== null && packagingRows !== null;
  const short = loaded ? [...rawRows, ...packagingRows].filter((item) => !materialCovered(item)).length : null;

  const start = async (): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    setMessage("");
    const result = await startBatch({ ...activityAudit, productionScheduleProductId: batchId });
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
    /** How many materials are short, or null until both lists have loaded; production must not start on a guess. */
    short,
    start, starting: starting.isLoading, message,
  };
}
export type BatchData = ReturnType<typeof useBatch>;
