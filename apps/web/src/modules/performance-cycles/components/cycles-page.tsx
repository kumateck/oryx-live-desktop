import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { cycleTypes, cycleStatuses, type Cycle } from "@/shared/performance/contracts";
import { CycleActions } from "./cycle-actions";
const Create = lazy(() => import("./create-cycle-dialog").then((m) => ({ default: m.CreateCycleDialog })));
const c = dataTableColumns<Cycle>();
const columns = c.columns([
  c.accessor("name", { header: "Cycle" }),
  c.accessor((r) => cycleTypes[r.type], { id: "type", header: "Type" }),
  c.accessor((r) => formatDate(r.periodStart), { id: "start", header: "Starts" }),
  c.accessor((r) => formatDate(r.periodEnd), { id: "end", header: "Ends" }),
  c.accessor((r) => cycleStatuses[r.status], { id: "status", header: "Status" }),
  c.accessor("goalCount", { header: "Goals" }),
  c.accessor("reviewCount", { header: "Reviews" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <CycleActions row={row.original} /> }),
]);
export function CyclesPage() {
  const query = performanceApi.usePerformanceCyclesQuery();
  const { has } = useAccess();
  const [creating, setCreating] = useState(false);
  return (
    <section className="page-fill">
      <PageHeader
        title="Performance cycles"
        crumbs={[{ label: "Human resources" }, { label: "Performance cycles" }]}
        actions={has("CanManagePerformanceCycles") ? <Button onClick={() => setCreating(true)}>Create cycle</Button> : null}
      />
      <ClientDataTable
        label="Performance cycles"
        rows={query.currentData ?? []}
        columns={columns}
        getRowId={(r) => r.id}
        initialPageSize={30}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No performance cycles"
        emptyDescription="Create a draft cycle before setting goals or starting reviews."
      />
      {creating ? (
        <Suspense fallback={<p role="status">Loading cycle form…</p>}>
          <Create onClose={() => setCreating(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}
