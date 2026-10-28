import { lazy, Suspense, useState } from "react";
import { Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { performanceApi } from "@/shared/performance/api";
import { reviewStatuses, ratingLabels, type Review } from "@/shared/performance/contracts";
const Create = lazy(() => import("./create-review-dialog").then((m) => ({ default: m.CreateReviewDialog })));
const schema = z.object({ cycle: z.object({ value: z.uuid(), label: z.string() }).nullable() });
const c = dataTableColumns<Review>();
const columns = c.columns([
  c.display({
    id: "employee",
    header: "Employee",
    cell: ({ row }) => (
      <Link className="text-primary hover:underline" to={`/hr/performance-reviews/${encodeURIComponent(row.original.id)}`}>
        {row.original.employeeName ?? row.original.employeeId}
      </Link>
    ),
  }),
  c.accessor((r) => r.cycleName ?? r.cycleId, { id: "cycle", header: "Cycle" }),
  c.accessor((r) => r.reviewerName ?? "Not assigned", { id: "reviewer", header: "Reviewer" }),
  c.accessor((r) => reviewStatuses[r.status], { id: "status", header: "Status" }),
  c.accessor((r) => (r.overallRating === null || r.overallRating === undefined ? "Not rated" : ratingLabels[r.overallRating]), {
    id: "rating",
    header: "Overall rating",
  }),
  c.accessor((r) => (r.approved ? "Yes" : "No"), { id: "approved", header: "Approved" }),
]);
export function ReviewsPage() {
  const { has, allows } = useAccess();
  const [creating, setCreating] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { cycle: null } });
  const cycle = useWatch({ control: form.control, name: "cycle" });
  const table = useServerTable({ resetKey: cycle?.value ?? "all" });
  const cycles = performanceApi.usePerformanceCyclesQuery(undefined, { skip: !has("CanViewPerformanceCycles") });
  const query = performanceApi.usePerformanceReviewsQuery({ page: table.page, pageSize: table.pageSize, ...(cycle ? { cycleId: cycle.value } : {}) });
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
        title="Performance reviews"
        crumbs={[{ label: "Human resources" }, { label: "Performance reviews" }]}
        actions={
          allows({
            kind: "all",
            permissions: ["CanManagePerformanceCycles", "CanViewPerformanceCycles", "CanViewActiveEmployee", "CanViewEmployeeDetails"],
          }) ? (
            <Button onClick={() => setCreating(true)}>Start review</Button>
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
        label="Performance reviews"
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
        emptyTitle="No matching reviews"
        emptyDescription="Change the cycle filter or start a review in an active cycle."
      />
      {creating ? (
        <Suspense fallback={<p role="status">Loading review form…</p>}>
          <Create onClose={() => setCreating(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}
