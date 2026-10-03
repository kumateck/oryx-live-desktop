import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePutApiV1ProductionScheduleByScheduleIdAddProductsMutation } from "../../api/schedule-api";
import { useScheduleLines } from "../../hooks/use-schedule-lines";
import { audit, schedulePermissions, scheduleDetailPath } from "../../lib/schedule-access";
import { toScheduleProducts } from "../../lib/schedule-products";
import { ScheduleLinesEditor } from "../schedule-lines-editor";

export function AddProductsForm({ scheduleId }: { scheduleId: string }) {
  const navigate = useNavigate();
  const lines = useScheduleLines();
  const [add, mutation] = usePutApiV1ProductionScheduleByScheduleIdAddProductsMutation();
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [schedulePermissions.addProducts], departmentType: 0 });
  const [saved, setSaved] = useState(false);
  const back = scheduleDetailPath(scheduleId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const products = await lines.read();
    if (!products) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const batches = toScheduleProducts(products);
    const result = await add({ ...audit, scheduleId, domainEntitiesProductionSchedulesAddProductsToScheduleRequest: { products: batches } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${batches.length} ${batches.length === 1 ? "batch" : "batches"} added to the schedule`);
    setSaved(true);
    void navigate(back);
  };
  const saving = mutation.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={lines.dirty && !saving && !saved} />
    <ScheduleLinesEditor lines={lines} title="Products to add" />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(back)}>Cancel</Button>
      <Button type="submit" disabled={saving || !permission.allowed}>{saving ? <><Spinner />Adding…</> : "Add to schedule"}</Button>
    </div>
  </form>;
}
