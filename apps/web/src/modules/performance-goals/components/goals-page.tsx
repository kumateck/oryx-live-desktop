import { lazy, Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { goalStatuses, type Goal } from "@/shared/performance/contracts";
import { GoalActions } from "./goal-actions";
import { PersonalPerformance } from "./personal-performance";
const Editor = lazy(() => import("./goal-editor").then((m) => ({ default: m.GoalEditor })));
const schema = z.object({ cycle: z.object({ value: z.uuid(), label: z.string() }).nullable() });
const c = dataTableColumns<Goal>();
const columns = c.columns([
  c.accessor("title", { header: "Goal" }),
  c.accessor((r) => r.employeeName ?? r.employeeId, { id: "employee", header: "Employee" }),
  c.accessor((r) => r.cycleName ?? r.cycleId, { id: "cycle", header: "Cycle" }),
  c.accessor((r) => `${r.weight}%`, { id: "weight", header: "Weight" }),
  c.accessor((r) => goalStatuses[r.status], { id: "status", header: "Status" }),
  c.accessor((r) => `${r.progressPercentage}%`, { id: "progress", header: "Progress" }),
  c.accessor((r) => formatDate(r.targetDate), { id: "target", header: "Target" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <GoalActions row={row.original} /> }),
]);
function TeamGoals() {
  const { has, allows } = useAccess();
  const [creating, setCreating] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { cycle: null } });
  const cycle = useWatch({ control: form.control, name: "cycle" });
  const table = useServerTable({ resetKey: cycle?.value ?? "all" });
  const cycles = performanceApi.usePerformanceCyclesQuery(undefined, { skip: !has("CanViewPerformanceCycles") });
  const query = performanceApi.usePerformanceGoalsQuery({ page: table.page, pageSize: table.pageSize, ...(cycle ? { cycleId: cycle.value } : {}) });
  const fields: WizardField<z.infer<typeof schema>>[] = [
    {
      type: I.SELECT,
      name: "cycle",
      label: "Cycle",
      mode: "single",
      source: "sync",
      options: (cycles.currentData ?? []).map((r) => ({ value: r.id, label: r.name })),
      placeholder: "All cycles",
    },
  ];
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title="Team goals"
        crumbs={[{ label: "Human resources" }, { label: "Goals" }]}
        actions={
          allows({ kind: "all", permissions: ["CanCreateGoal", "CanViewPerformanceCycles", "CanViewActiveEmployee", "CanViewEmployeeDetails"] }) ? (
            <Button onClick={() => setCreating(true)}>Create goal</Button>
          ) : null
        }
      />
      {has("CanViewPerformanceCycles") ? (
        <div className="max-w-sm">
          <FormWizard form={form} fields={fields} />
          {cycles.isError ? <p role="alert">Cycle filters could not be loaded.</p> : null}
        </div>
      ) : null}
      <ServerDataTable
        label="Team goals"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No matching goals"
        emptyDescription="Change the cycle filter or create a goal for an employee."
      />
      {creating ? (
        <Suspense fallback={<p role="status">Loading goal editor…</p>}>
          <Editor onClose={() => setCreating(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}
export function GoalsPage() {
  const { has } = useAccess();
  const team = has("CanViewTeamGoals") && has("CanViewOwnGoals");
  const [view, setView] = useState<"mine" | "team">(team ? "team" : "mine");
  if (!has("CanViewOwnGoals"))
    return (
      <section className="space-y-3">
        <PageHeader title="Goals" crumbs={[{ label: "Human resources" }, { label: "Goals" }]} />
        <p role="alert">The server lists goals only with own-goal access. No employee goals were requested.</p>
      </section>
    );
  const toggle = team ? (
    <div className="flex gap-2" role="group" aria-label="Goals view">
      <Button size="sm" variant={view === "team" ? "default" : "outline"} aria-pressed={view === "team"} onClick={() => setView("team")}>Team goals</Button>
      <Button size="sm" variant={view === "mine" ? "default" : "outline"} aria-pressed={view === "mine"} onClick={() => setView("mine")}>My goals and reviews</Button>
    </div>
  ) : null;
  if (view === "team" && team) return <div className="space-y-3">{toggle}<TeamGoals /></div>;
  return (
    <section className="space-y-4">
      <PageHeader title="My goals and reviews" crumbs={[{ label: "Human resources" }, { label: "Goals" }]} actions={toggle} />
      <PersonalPerformance />
    </section>
  );
}
