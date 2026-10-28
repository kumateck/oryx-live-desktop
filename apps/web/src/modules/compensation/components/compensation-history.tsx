import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { compensationApi } from "../api/compensation-api";
import type { Compensation } from "../schemas/contracts";
import { CompensationRecord } from "./compensation-record";
function RecordPreview({ row }: { row: Compensation }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        View full record
      </Button>
      {open ? (
        <Dialog open onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Compensation record</DialogTitle>
              <DialogDescription>Saved salary, allowances, bank details and effective dates for this historical record.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <CompensationRecord row={row} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
const c = dataTableColumns<Compensation>();
const columns = c.columns([
  c.accessor((row) => formatDate(row.effectiveFrom) ?? "Not recorded", { id: "from", header: "From", enableSorting: false }),
  c.accessor((row) => formatDate(row.effectiveTo) ?? "No end date", { id: "to", header: "Until", enableSorting: false }),
  c.accessor("basicSalary", { header: "Basic salary (GHS)", enableSorting: false }),
  c.accessor("totalAllowances", { header: "Allowances (GHS)", enableSorting: false }),
  c.display({ id: "record", header: "Record", cell: ({ row }) => <RecordPreview row={row.original} /> }),
]);
export function CompensationHistory({ employeeId }: { employeeId: string }) {
  const table = useServerTable({ resetKey: employeeId });
  const query = compensationApi.useCompensationHistoryQuery({ employeeId, page: table.page, pageSize: table.pageSize });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  const invalid = rows.some((row) => row.employeeId !== employeeId);
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Compensation history</h2>
      <ServerDataTable
        label="Compensation history"
        columns={columns}
        rows={invalid ? [] : rows}
        getRowId={(row) => row.id}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={invalid ? "The server returned another employee's history." : query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No compensation history"
        emptyDescription="No compensation records were returned for this employee."
      />
    </section>
  );
}
