import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductionScheduleByScheduleIdQuery, usePutApiV1ProductionScheduleByScheduleIdMutation } from "../api/schedule-api";
import { audit, schedulePermissions } from "../lib/schedule-access";
import { scheduleRowSchema, type ScheduleHeaderFormValues } from "../schemas/schedule-schema";

/** One schedule's dates and remarks, for editing. Its products are changed elsewhere. */
export function useScheduleHeader(scheduleId: string) {
  const query = useGetApiV1ProductionScheduleByScheduleIdQuery({ ...audit, scheduleId });
  const [update, mutation] = usePutApiV1ProductionScheduleByScheduleIdMutation();
  const parsed = useMemo(() => query.data ? scheduleRowSchema.safeParse(query.data) : null, [query.data]);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [schedulePermissions.edit], departmentType: 0 });

  const save = async (values: ScheduleHeaderFormValues): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return false; }
    setMessage("");
    const result = await update({ ...audit, scheduleId, domainEntitiesProductionSchedulesUpdateProductionScheduleRequest: {
      remarks: values.remarks ?? "", scheduledStartTime: values.scheduledStartTime.toISOString(), scheduledEndTime: values.scheduledEndTime.toISOString(),
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return false; }
    toast.success("Schedule updated");
    return true;
  };

  return {
    schedule: parsed?.success ? parsed.data : null,
    loading: query.isLoading,
    notFound: Boolean(query.error && "status" in query.error && query.error.status === 404),
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a schedule the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: mutation.isLoading, message, save,
  };
}
