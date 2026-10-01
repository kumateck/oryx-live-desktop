import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { EditScheduleForm } from "../../../../../../modules/schedules/components/edit-schedule-form";
import { useScheduleHeader } from "../../../../../../modules/schedules/hooks/use-schedule-header";

function EditSchedule({ id }: { id: string }) {
  const state = useScheduleHeader(id);
  return <section className="min-w-0 space-y-4">
    <PageHeader title={state.loading ? null : state.schedule ? `Edit ${state.schedule.code ?? "schedule"}` : "Edit schedule"} crumbs={[{ label: state.schedule?.code ?? "Schedule" }, { label: "Edit" }]} />
    {state.loading ? <FormPageSkeleton label="Loading schedule" sections={[3]} />
      : state.schedule ? <EditScheduleForm schedule={state.schedule} saving={state.saving} message={state.message} onSave={state.save} />
        : <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">{state.notFound ? "This schedule does not exist or was removed." : state.error ?? "The schedule could not be loaded."}
          {state.notFound ? null : <Button type="button" size="sm" variant="outline" onClick={state.retry}>Retry</Button>}</div>}
  </section>;
}

export default function EditSchedulePage() {
  const { id } = useParams();
  return id ? <EditSchedule id={id} /> : null;
}
