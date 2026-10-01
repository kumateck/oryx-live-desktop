import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { schedulesPath } from "../lib/schedule-access";
import { schedulePhase, tomorrow } from "../lib/schedule-dates";
import { scheduleHeaderFields } from "../lib/schedule-header-fields";
import { scheduleHeaderFormSchema, type ScheduleHeaderFormValues, type ScheduleRow } from "../schemas/schedule-schema";

const savedDate = (value: string | null | undefined) => { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date : null; };

export function EditScheduleForm({ schedule, saving, message, onSave }: {
  schedule: ScheduleRow;
  saving: boolean;
  message: string;
  onSave: (values: ScheduleHeaderFormValues) => Promise<boolean>;
}) {
  const navigate = useNavigate();
  const [headerFields] = useState(() => scheduleHeaderFields(tomorrow()) satisfies readonly WizardField<ScheduleHeaderFormValues>[]);
  const [saved, setSaved] = useState(false);
  const start = savedDate(schedule.scheduledStartTime);
  const end = savedDate(schedule.scheduledEndTime);
  const form = useForm<ScheduleHeaderFormValues>({ resolver: zodResolver(scheduleHeaderFormSchema),
    defaultValues: { remarks: schedule.remarks ?? "", ...(start ? { scheduledStartTime: start } : {}), ...(end ? { scheduledEndTime: end } : {}) } });
  const phase = schedulePhase(schedule.scheduledStartTime, schedule.scheduledEndTime);
  const submit = form.handleSubmit(async (values) => { if (await onSave(values)) { setSaved(true); void navigate(schedulesPath); } });

  if (phase === "ended") return <div role="alert" className="space-y-3 rounded-lg border bg-card p-4 text-sm">
    <p>This schedule has ended. Its dates, remarks, and products can no longer be changed.</p>
    <Button type="button" variant="outline" size="sm" onClick={() => void navigate(schedulesPath)}>Back to schedules</Button>
  </div>;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <dl className="text-sm"><dt className="text-xs text-muted-foreground">Schedule code</dt><dd className="font-medium">{schedule.code ?? "–"}</dd></dl>
      {phase === "running" ? <p className="rounded-md border bg-muted/50 p-3 text-sm">This schedule has already started. The server only accepts a start date after today, so saving a change means moving the start date forward.</p> : null}
      <FormWizard form={form} fields={headerFields} className="md:grid-cols-2" />
      <p className="text-xs text-muted-foreground">The code cannot be changed. Products are added to or removed from a schedule separately.</p>
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(schedulesPath)}>Cancel</Button>
      <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : "Save changes"}</Button>
    </div>
  </form>;
}
