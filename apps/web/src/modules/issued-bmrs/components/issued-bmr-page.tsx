import { useMemo, useState } from "react";
import { History, Pencil, CalendarDays, Printer, Rows3, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownButton, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { useListIssuedBmrRecordsQuery } from "../api/issued-bmr-api";
import { issuedBmrAudit, issuedBmrPermissions } from "../lib/access";
import { issuedBmrPageSchema, type IssuedBmr } from "../schemas/issued-bmr";
import { NumberCorrectionDialog, DateRevisionDialog } from "./correction-dialogs";
import { BmrHistoryDialog } from "./history-dialog";
import { IssuedFiltersBar } from "./issued-filters";
import { IssuedRegisterPrint, type RegisterLayout } from "./issued-register-print";
import { useDepartmentOptions } from "../hooks/use-department-options";
import { filterArgs, filterProblem, noFilters, type IssuedFilters } from "../lib/filters";

const column = dataTableColumns<IssuedBmr>();
type Action = { kind: "number" | "dates" | "history"; row: IssuedBmr } | null;

export function IssuedBmrPage() {
  const [action, setAction] = useState<Action>(null);
  const [filters, setFilters] = useState<IssuedFilters>(noFilters);
  const [printing, setPrinting] = useState<RegisterLayout | null>(null);
  const departments = useDepartmentOptions();
  const search = usePageSearch("issued BMRs");
  const problem = filterProblem(filters);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${filters.departmentId}|${filters.from}|${filters.to}` });
  const query = useListIssuedBmrRecordsQuery({ ...issuedBmrAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...filterArgs(filters) }, { skip: Boolean(problem) });
  const parsed = useMemo(() => query.data ? issuedBmrPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const columns = useMemo(() => column.columns([
    column.accessor("batchNumber", { header: "Batch number", size: 150 }),
    column.accessor("productName", { header: "Product", cell: ({ row }) => <div><div className="break-words font-medium">{row.original.productName}</div><div className="text-xs text-muted-foreground">{row.original.productCode}</div></div> }),
    column.accessor("departmentName", { header: "Department", size: 150 }),
    column.accessor("scheduleCode", { header: "Schedule", size: 130 }),
    column.accessor("manufacturingDate", { header: "Manufactured", size: 130, cell: ({ row }) => formatMonthYear(row.original.manufacturingDate) ?? "Not set" }),
    column.accessor("expiryDate", { header: "Expires", size: 130, cell: ({ row }) => formatMonthYear(row.original.expiryDate) ?? "Not set" }),
    column.accessor("issuedAt", { header: "Issued", size: 150, cell: ({ row }) => formatDateTime(row.original.issuedAt) ?? "–" }),
    column.display({ id: "state", header: "Revisions", size: 150, cell: ({ row }) => row.original.isRetired ? <Badge variant="outline">Retired</Badge>
      : row.original.pendingRevisions ? <Badge variant="outline">Pending approval</Badge> : "–" }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, enableHiding: false, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.batchNumber}`} items={[
      !row.original.isRetired && { id: "correct", label: "Correct batch number", icon: Pencil, require: issuedBmrPermissions.correct, onSelect: () => setAction({ kind: "number", row: row.original }) },
      !row.original.isRetired && row.original.pendingRevisions === 0 && { id: "revise", label: "Request date revision", icon: CalendarDays, require: issuedBmrPermissions.revise, onSelect: () => setAction({ kind: "dates", row: row.original }) },
      { id: "history", label: "History and revisions", icon: History, require: issuedBmrPermissions.view, onSelect: () => setAction({ kind: "history", row: row.original }) },
    ]} /> }),
  ]), []);
  const close = () => setAction(null);
  return <section className="page-fill">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1"><h1 className="text-xl font-semibold">Issued BMR records</h1>
        <p className="text-sm text-muted-foreground">Already-issued product batches. Correct batch-number typos or request an approved date revision.</p></div>
      <DropdownButton label="Print" icon={Printer} disabled={Boolean(problem)} items={[
        { id: "register", label: "Issued BMR & BPR register", icon: Rows3, require: issuedBmrPermissions.print, onSelect: () => setPrinting("register") },
        { id: "by-product", label: "Issued by product", icon: Package, require: issuedBmrPermissions.print, onSelect: () => setPrinting("byProduct") },
      ]} />
    </div>
    <IssuedFiltersBar filters={filters} departments={departments} onChange={setFilters} />
    <ServerDataTable label="Issued BMR records" columns={columns} rows={rows} getRowId={row => row.id}
      page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned issued BMR records the app could not read." : null}
      emptyTitle="No issued BMRs found" emptyDescription={search.trim() ? "Search by batch number, product code or name." : "BMRs appear here after issue to production."} />
    {action?.kind === "number" ? <NumberCorrectionDialog row={action.row} onClose={close} onDone={close} /> : null}
    {action?.kind === "dates" ? <DateRevisionDialog row={action.row} onClose={close} onDone={close} /> : null}
    {action?.kind === "history" ? <BmrHistoryDialog row={action.row} onClose={close} /> : null}
    {printing ? <IssuedRegisterPrint layout={printing} filters={filters} search={search} onClose={() => setPrinting(null)}
      department={departments.find((item) => item.value === filters.departmentId)?.label ?? null} /> : null}
  </section>;
}
