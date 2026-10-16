import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useAnalystOptions } from "@/shared/qc/use-analyst-options";
import { routinesApi } from "../api/routines-api";
import { useRndBatchOptions, useRndProjectOptions } from "../lib/pickers";
import { calendarPeriod, cadenceLabel, originOptions, RoutineCadence, RoutineOrigin, routinePath, routinePermissions, typeOptions } from "../lib/routines";

const option = z.object({ value: z.string(), label: z.string() });
const schema = z.object({
  origin: option, type: option, definition: option.nullable(), routineDate: z.date({ message: "Choose the routine date." }),
  doneBy: option.nullable().refine((value): boolean => value !== null, "Choose who does the routine."),
  emergencyTrigger: z.string().nullish(), emergencyReason: z.string().nullish(), project: option.nullable(), batch: option.nullable(),
}).superRefine((values, context) => {
  if (values.origin.value === "0" && !values.definition) context.addIssue({ code: "custom", path: ["definition"], message: "Choose the schedule." });
  if (values.origin.value === "1") {
    if (!values.emergencyTrigger?.trim()) context.addIssue({ code: "custom", path: ["emergencyTrigger"], message: "Say what triggered it." });
    if (!values.emergencyReason?.trim()) context.addIssue({ code: "custom", path: ["emergencyReason"], message: "Give the reason." });
  }
  if (values.project && !values.batch) context.addIssue({ code: "custom", path: ["batch"], message: "Choose the trial batch, or clear the project." });
});
type Values = z.input<typeof schema>;
const performers = [routinePermissions.perform] as const;

/** A scheduled routine for a month or quarter, or an emergency one with its trigger and reason. Opens the new routine. */
export function RoutineDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const permission = usePermissionAction(routinePermissions.create);
  const definitions = routinesApi.useListDefinitionsQuery(undefined);
  const [create] = routinesApi.useCreateRoutineMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { origin: originOptions[0], type: typeOptions[0], definition: null, routineDate: new Date(), doneBy: null, project: null, batch: null, emergencyTrigger: "", emergencyReason: "" } });
  const origin = useWatch({ control: form.control, name: "origin" });
  const type = useWatch({ control: form.control, name: "type" });
  const project = useWatch({ control: form.control, name: "project" });
  void form.formState.errors;
  const loadAnalysts = useAnalystOptions(performers);
  const loadProjects = useRndProjectOptions();
  const loadBatches = useRndBatchOptions(project?.value ?? null);
  // Another project offers other batches, so the chosen one is cleared.
  const projectId = project?.value;
  useEffect(() => { form.setValue("batch", null); }, [projectId, form]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const scheduled = origin.value === "0";
  const schedules = useMemo(() => (definitions.data ?? []).filter((item) => item.isActive && String(item.type) === type.value)
    .map((item) => ({ value: item.id, label: `${item.name ?? "Schedule"} · ${cadenceLabel(item.cadence)}` })), [definitions.data, type.value]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "origin", label: "Origin", required: true, options: originOptions },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "type", label: "Routine type", required: true, options: typeOptions },
    { type: InputTypes.DATE, name: "routineDate", label: "Routine date", required: true, fromYear: 2020, toYear: 2100 },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "doneBy", label: "Done by", required: true, loadOptions: loadAnalysts, placeholder: "Choose an analyst", searchPlaceholder: "Search people" },
    ...(scheduled ? [{ type: InputTypes.SELECT, mode: "single", source: "sync", name: "definition", label: "Schedule", required: true, options: schedules,
      placeholder: schedules.length ? "Choose a schedule" : "No active schedule for this type", description: "The calendar month or quarter containing the routine date is recorded as its period.", className: "md:col-span-2" } as const]
      : [{ type: InputTypes.TEXT, name: "emergencyTrigger", label: "Emergency trigger", required: true } as const,
        { type: InputTypes.TEXTAREA, name: "emergencyReason", label: "Emergency reason", required: true, rows: 3 } as const]),
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "project", label: "R&D project", loadOptions: loadProjects, placeholder: "Optional", searchPlaceholder: "Search projects", description: "Only when the routine relates to an R&D trial batch." },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "batch", label: "R&D trial batch", loadOptions: loadBatches, placeholder: project ? "Choose the batch" : "Choose the project first", disabled: !project },
  ] as const satisfies readonly WizardField<Values>[], [scheduled, schedules, loadAnalysts, loadProjects, loadBatches, project]);

  const submit = form.handleSubmit(async (raw) => {
    const values = schema.parse(raw);
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const definition = scheduled ? (definitions.data ?? []).find((item) => item.id === values.definition?.value) : undefined;
    if (scheduled && !definition) { setMessage("Choose an active schedule."); return; }
    setBusy(true);
    setMessage("");
    const result = await create({
      origin: scheduled ? RoutineOrigin.Scheduled : RoutineOrigin.Emergency, type: Number(values.type.value), routineDefinitionId: definition?.id ?? null,
      routineDate: values.routineDate.toISOString(), doneById: values.doneBy?.value ?? "",
      ...(definition ? calendarPeriod(values.routineDate, definition.cadence === RoutineCadence.Quarterly ? 3 : 1) : {}),
      emergencyTrigger: scheduled ? null : values.emergencyTrigger?.trim() ?? null, emergencyReason: scheduled ? null : values.emergencyReason?.trim() ?? null,
      rndTrialBatchId: values.batch?.value ?? null,
    });
    setBusy(false);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Routine created");
    onClose();
    void navigate(routinePath(result.data));
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>New routine</DialogTitle><DialogDescription>Add its samples or monitored areas once it is created; each gets its analysis worksheets.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {definitions.error ? <p role="alert" className="text-sm text-destructive">The schedules could not be loaded: {apiErrorMessage(definitions.error)}</p> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Creating…</> : "Create routine"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
