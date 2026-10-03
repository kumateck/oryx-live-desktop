import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { daysOfWeek, useSaveWorkingDaysMutation, weekBody, weekOf, weekProblems, workingDayApi, workingDayAudit, workingDayPermissions, workingDaysSchema, type WeekValues } from "./working-days";

/** The company's working week: which days are worked, and from when until when. */
export function WorkingDaysPage() {
  const { has } = useAccess();
  const query = workingDayApi.useGetApiV1WorkingDaysQuery({ ...workingDayAudit, page: 1, pageSize: 50 });
  const [save, saving] = useSaveWorkingDaysMutation();
  const saved = useMemo(() => { const parsed = workingDaysSchema.safeParse(query.data ?? {}); return parsed.success ? parsed.data : []; }, [query.data]);
  const form = useForm<WeekValues>({ defaultValues: weekOf([]) });
  // The form follows what the server holds until the user changes something.
  useEffect(() => { if (query.data && !form.formState.isDirty) form.reset(weekOf(saved)); }, [query.data, saved, form]);
  const days = useWatch({ control: form.control, name: "days" });
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const maySave = has(workingDayPermissions.save);
  const dirty = form.formState.isDirty;

  if (query.isLoading) return <section className="page-fill"><SettingsHeader title="Working days" description="The days and hours the company works." /><FormPageSkeleton label="Loading working days" sections={[7]} /></section>;
  if (query.error) return <section className="page-fill"><SettingsHeader title="Working days" description="The days and hours the company works." />
    <div role="alert" className="space-y-3"><p>{apiErrorMessage(query.error)}</p><Button type="button" variant="outline" onClick={() => { void query.refetch(); }}>Retry</Button></div></section>;

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const found = weekProblems(values);
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    const result = await save(weekBody(values));
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    form.reset(values);
    toast.success("Working days saved");
  });
  return <section className="page-fill">
    <SettingsHeader title="Working days" description="The days and hours the company works." />
    <form noValidate onSubmit={(event) => { void submit(event); }} className="max-w-3xl space-y-4">
      <fieldset disabled={!maySave || saving.isLoading} className="space-y-4">
        <div role="group" aria-label="Working days" className="flex flex-wrap gap-2">{daysOfWeek.map((name, day) => <Button key={name} type="button" size="sm" variant={days[day]?.on ? "default" : "outline"} aria-pressed={Boolean(days[day]?.on)}
          onClick={() => form.setValue(`days.${day}.on`, !days[day]?.on, { shouldDirty: true })}>{name}</Button>)}</div>
        {problems.week ? <p role="alert" className="text-sm text-destructive">{problems.week}</p> : null}
        {days.some((day) => day.on) ? <ul className="divide-y rounded-lg border">{days.map((day) => day.on ? <li key={day.day} className="space-y-1 p-3">
          <div className="grid items-end gap-3 sm:grid-cols-[8rem_1fr]"><p className="pb-2 text-sm font-medium">{daysOfWeek[day.day]}</p>
            <FormWizard form={form} className="grid-cols-2" fields={[{ type: InputTypes.CLOCK, name: `days.${day.day}.startTime`, label: `${daysOfWeek[day.day]} start time` }, { type: InputTypes.CLOCK, name: `days.${day.day}.endTime`, label: `${daysOfWeek[day.day]} end time` }]} /></div>
          {problems[day.day] ? <p role="alert" className="text-sm text-destructive">{problems[day.day]}</p> : null}</li> : null)}</ul>
          : <p className="text-sm text-muted-foreground">No working day is chosen.</p>}
      </fieldset>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      {maySave ? <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!dirty || saving.isLoading}>{saving.isLoading ? <><Spinner />Saving…</> : "Save working days"}</Button>
        {has(workingDayPermissions.reset) ? <Button type="button" variant="outline" disabled={!dirty || saving.isLoading} onClick={() => { form.reset(weekOf(saved)); setProblems({}); setMessage(""); }}>Reset to saved</Button> : null}
      </div> : <p className="text-sm text-muted-foreground">You can view the working days but not change them.</p>}
    </form>
  </section>;
}
