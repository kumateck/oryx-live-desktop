import { lazy, Suspense, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { compensationApi } from "../api/compensation-api";
import { adjustmentLabels, type AdjustmentKind, type Adjustment } from "../schemas/contracts";
import { useAdjustmentCommand } from "../hooks/use-adjustment-command";
const Add = lazy(() => import("./adjustment-dialog").then((module) => ({ default: module.AdjustmentDialog })));
function Delete({ row, kind, employeeId, onClose }: { row: Adjustment; kind: AdjustmentKind; employeeId: string; onClose: () => void }) {
  const command = useAdjustmentCommand(kind, employeeId, row, () => {});
  return (
    <ConfirmActionDialog
      title={`Delete ${kind === "relief" ? "tax relief" : kind}`}
      description="The server removes this adjustment from future calculations and records its deletion. Existing processed payslips retain their values."
      require="CanManageCompensation"
      confirmLabel="Delete adjustment"
      busyLabel="Deleting…"
      onClose={onClose}
      onConfirm={() => command.run()}
    />
  );
}
const c = dataTableColumns<Adjustment>();
export function AdjustmentsSection({ employeeId, kind }: { employeeId: string; kind: AdjustmentKind }) {
  const query = compensationApi.useCompensationAdjustmentsQuery({ employeeId, kind });
  const { has } = useAccess();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Adjustment | null>(null);
  const title = kind === "addition" ? "Additions" : kind === "deduction" ? "Deductions" : "Annual tax reliefs";
  const columns = c.columns([
    c.accessor((row) => adjustmentLabels[kind][row.type] ?? "Unrecognized type", { id: "type", header: "Type" }),
    c.accessor("description", { header: "Description" }),
    c.accessor("amount", { header: kind === "relief" ? "Annual amount (GHS)" : "Amount (GHS)" }),
    c.accessor((row) => (row.isRecurring === null ? "Not applicable" : row.isRecurring ? "Yes" : "No"), { id: "recurring", header: "Recurring" }),
    c.accessor((row) => (row.isTaxable === null ? "Not applicable" : row.isTaxable ? "Yes" : "No"), { id: "taxable", header: "Taxable" }),
    c.accessor((row) => formatDate(row.effectiveFrom) ?? "Not recorded", { id: "from", header: "From" }),
    c.accessor((row) => formatDate(row.effectiveTo) ?? "No end date", { id: "to", header: "Until" }),
    c.display({
      id: "actions",
      header: "",
      size: 40,
      cell: ({ row }) => (
        <TableMenu
          label={`${title} actions`}
          items={[
            {
              id: "delete",
              label: "Delete adjustment",
              icon: Trash2,
              destructive: true,
              require: "CanManageCompensation",
              onSelect: () => setDeleting(structuredClone(row.original)),
            },
          ]}
        />
      ),
    }),
  ]);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {has("CanManageCompensation") ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add {kind === "relief" ? "relief" : kind}
          </Button>
        ) : null}
      </div>
      <ClientDataTable
        label={title}
        columns={columns}
        rows={query.currentData ?? []}
        getRowId={(row) => row.id}
        initialPageSize={30}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle={`No ${title.toLocaleLowerCase()}`}
        emptyDescription="No adjustments were returned for this employee."
      />
      {adding ? (
        <Suspense fallback={<p role="status">Loading adjustment form…</p>}>
          <Add employeeId={employeeId} kind={kind} onClose={() => setAdding(false)} />
        </Suspense>
      ) : null}
      {deleting ? <Delete employeeId={employeeId} kind={kind} row={deleting} onClose={() => setDeleting(null)} /> : null}
    </section>
  );
}
