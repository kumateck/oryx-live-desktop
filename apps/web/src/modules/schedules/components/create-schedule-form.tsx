import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePostApiV1ProductionScheduleMutation } from "../api/schedule-api";
import { useScheduleLines } from "../hooks/use-schedule-lines";
import { audit, schedulePermissions, scheduleCodeModel, schedulesPath } from "../lib/schedule-access";
import { today } from "../lib/schedule-dates";
import { scheduleHeaderFields } from "../lib/schedule-header-fields";
import { toScheduleProducts } from "../lib/schedule-products";
import { newScheduleFormSchema, type NewScheduleFormValues } from "../schemas/schedule-schema";
import { ScheduleLinesEditor } from "./schedule-lines-editor";

const codeField = [{ type: InputTypes.TEXT, name: "code", label: "Schedule code", required: true }] as const satisfies readonly WizardField<NewScheduleFormValues>[];

export function CreateScheduleForm() {
  const navigate = useNavigate();
  const lines = useScheduleLines();
  const code = useGeneratedCode(scheduleCodeModel);
  const [create, mutation] = usePostApiV1ProductionScheduleMutation();
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [schedulePermissions.create], departmentType: 0 });
  const [headerFields] = useState(() => scheduleHeaderFields(today()) satisfies readonly WizardField<NewScheduleFormValues>[]);
  const form = useForm<NewScheduleFormValues>({ resolver: zodResolver(newScheduleFormSchema), defaultValues: { code: "", remarks: "" } });
  const [saved, setSaved] = useState(false);

  const suggestCode = async (replace: boolean) => {
    const next = await code.suggest();
    if (next && (replace || !form.getValues("code"))) form.setValue("code", next, { shouldValidate: true, shouldDirty: replace });
  };
  // Offer a code once, when the rule has loaded, without overwriting what the user typed meanwhile.
  const suggested = useRef(false);
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void suggestCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code.ready]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    // The schedule and its products are two forms; both are checked so every message shows at once.
    const products = await lines.read();
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      if (!products) return;
      const result = await create({ ...audit, domainEntitiesProductionSchedulesCreateProductionScheduleRequest: {
        code: values.code, remarks: values.remarks ?? "", products: toScheduleProducts(products),
        scheduledStartTime: values.scheduledStartTime.toISOString(), scheduledEndTime: values.scheduledEndTime.toISOString(),
      } });
      if ("error" in result) {
        const reason = apiErrorMessage(result.error);
        if (/code is already in use/i.test(reason)) form.setError("code", { message: "This code is already used by another schedule. Use \"Suggest again\" or enter a different one." });
        else setMessage(reason);
        return;
      }
      toast.success("Production schedule created");
      setSaved(true);
      void navigate(schedulesPath);
    })();
  };
  const saving = mutation.isLoading;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={(form.formState.isDirty || lines.dirty) && !saving && !saved} />
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Schedule</h2>
      <FormWizard form={form} fields={codeField} className="md:grid-cols-2" />
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {code.unavailable ? "No code rule is set up for schedules; enter the code yourself." : "The code is suggested from the next number in the series. You can change it."}
        {code.ready ? <Button type="button" size="xs" variant="ghost" disabled={code.busy} onClick={() => void suggestCode(true)}>Suggest again</Button> : null}
      </p>
      <FormWizard form={form} fields={headerFields} className="md:grid-cols-2" />
    </section>
    <ScheduleLinesEditor lines={lines} />
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(schedulesPath)}>Cancel</Button>
      <Button type="submit" disabled={saving || !permission.allowed}>{saving ? <><Spinner />Creating…</> : "Create schedule"}</Button>
    </div>
  </form>;
}
