import { PageHeader } from "@/shared/navigation/page-header";
import { CreateScheduleForm } from "../../../../../modules/schedules/components/create-schedule-form";

export default function CreateSchedulePage() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Create production schedule" crumbs={[{ label: "Create" }]} />
    <CreateScheduleForm />
  </section>;
}
