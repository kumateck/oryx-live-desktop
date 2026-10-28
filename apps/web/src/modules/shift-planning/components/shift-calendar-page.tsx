import { lazy, Suspense, useState } from "react";
import { useParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { KeyFacts, KeyFact } from "@/shared/detail/key-facts";
import { useAccess } from "@/shared/auth/use-access";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { hrApi } from "../api/shift-api";
import { scheduleSchema, assignmentSchema, statuses, frequencies, audit, CalendarMode, type Schedule } from "../schemas/contracts";
import { assignmentProblem, visibleAssignments, scheduleWriteProblem, calendarRange } from "../lib/calendar";
import { CalendarRows } from "./calendar-rows";
const Assign = lazy(() => import("./assign-dialog").then((m) => ({ default: m.AssignDialog })));
const schema = z.object({ date: z.date().nullable() });
const fields: WizardField<z.infer<typeof schema>>[] = [{ type: I.DATE, name: "date", label: "Calendar date", required: true }];
function Calendar({ schedule }: { schedule: Schedule }) {
  const { allows } = useAccess();
  const [mode, setMode] = useState(CalendarMode.Week);
  const [assigning, setAssigning] = useState<Schedule | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date(`${schedule.startDate.slice(0, 10)}T00:00:00`) },
  });
  const anchor = useWatch({ control: form.control, name: "date" });
  const query = hrApi.useGetApiV1ShiftSchedulesByScheduleIdViewQuery({
    ...audit,
    scheduleId: schedule.id,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
  });
  const parsed = z.array(assignmentSchema).safeParse(query.currentData);
  const problem = parsed.success ? assignmentProblem(parsed.data, schedule) : null;
  const rows = parsed.success && !problem ? parsed.data : [];
  const range = anchor ? calendarRange(anchor, mode) : null;
  return (
    <article className="space-y-4">
      <PageHeader
        title={schedule.scheduleName}
        crumbs={[{ label: "Plan shift", to: "/plan-shift" }, { label: "Calendar" }]}
        actions={
          !scheduleWriteProblem(schedule) &&
          allows({ kind: "all", permissions: ["CanCreateShiftSchedule", "CanViewEmployeeDetails", "CanViewShiftCategories", "CanViewWorkingHoursPolicy"] }) ? (
            <Button onClick={() => setAssigning(structuredClone(schedule))}>Assign employees</Button>
          ) : null
        }
      />
      <KeyFacts>
        <KeyFact label="Department" value={schedule.department?.name ?? schedule.departmentId} />
        <KeyFact label="Period" value={`${schedule.startDate.slice(0, 10)} – ${schedule.endDate.slice(0, 10)}`} />
        <KeyFact label="Frequency" value={frequencies[schedule.frequency]} />
        <KeyFact label="Status" value={statuses[schedule.scheduleStatus]} />
      </KeyFacts>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
        {schedule.shiftType.map((s) => (
          <li key={s.id}>
            {s.shiftName}: {s.startTime}–{s.endTime}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">
          <FormWizard form={form} fields={fields} />
        </div>
        <div role="group" aria-label="Calendar view" className="flex flex-wrap gap-1">
          {([CalendarMode.Week, CalendarMode.Month, CalendarMode.Year, CalendarMode.Day] as const).map((value) => (
            <Button key={value} variant={mode === value ? "secondary" : "ghost"} aria-pressed={mode === value} onClick={() => setMode(value)}>
              {["Weekly", "Monthly", "Yearly", "Day"][value]}
            </Button>
          ))}
        </div>
      </div>
      {range ? (
        <p className="text-muted-foreground">
          {range.from} – {range.to}
        </p>
      ) : (
        <p role="alert">Choose a calendar date.</p>
      )}
      {query.isLoading ? (
        <DetailPageSkeleton label="Loading calendar assignments" groups={2} />
      ) : query.error || !parsed.success || problem ? (
        <div role="alert" className="space-y-2">
          <p>{query.error ? apiErrorMessage(query.error) : (problem ?? "Calendar assignments could not be verified.")}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry calendar
          </Button>
        </div>
      ) : (
        <CalendarRows schedule={schedule} rows={rows} visible={anchor ? visibleAssignments(rows, anchor, mode) : []} onChanged={() => void query.refetch()} />
      )}
      {assigning ? (
        <Suspense fallback={<p role="status">Loading assignment form…</p>}>
          <Assign
            schedule={assigning}
            onClose={() => {
              setAssigning(null);
              void query.refetch();
            }}
          />
        </Suspense>
      ) : null}
    </article>
  );
}
function Detail({ id }: { id: string }) {
  const query = hrApi.useGetApiV1ShiftSchedulesByIdQuery({ ...audit, id });
  const parsed = scheduleSchema.safeParse(query.currentData);
  if (query.isLoading) return <DetailPageSkeleton label="Loading shift schedule" groups={3} />;
  if (query.error || !parsed.success || parsed.data.id !== id)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Schedule unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The schedule contract could not be verified."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return <Calendar key={id} schedule={parsed.data} />;
}
export function ShiftCalendarPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : <p role="alert">Schedule ID is missing.</p>;
}
