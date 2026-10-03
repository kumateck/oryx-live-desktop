import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useForm, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { settingsApi } from "@/shared/api/generated/settings";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePageSearch } from "@/shared/search/page-search";
import { actionTypeLabels, activityRowsSchema, audit, type ActivityRow } from "./audit-trail";

const { useGetApiV1ActivityLogQuery } = settingsApi;
interface Filter { range: DateRange | null }
const fields: WizardField<Filter>[] = [{ type: InputTypes.RANGE, name: "range", label: "Between", maxDate: new Date(), placeholder: "Any date" }];
const column = dataTableColumns<ActivityRow>();
const columns = column.columns([
  column.accessor("user", { header: "User", size: 230, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.user}</div><div className="break-all text-xs text-muted-foreground">{row.original.email ?? ""}</div></div> }),
  column.accessor("action", { header: "Action", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.action}</div>
    {row.original.failed ? <div className="text-xs text-destructive">Refused by the server{row.original.statusCode ? ` (${row.original.statusCode})` : ""}</div> : null}</div> }),
  column.accessor((row) => row.area ?? "", { id: "area", header: "Area", size: 240, cell: ({ row }) => row.original.area ?? <span className="text-muted-foreground">–</span> }),
  column.accessor((row) => row.actionType ?? -1, { id: "type", header: "Kind", size: 120, cell: ({ row }) => row.original.actionType === null ? <span className="text-muted-foreground">–</span>
    : <Badge variant={row.original.actionType === 3 ? "destructive" : row.original.actionType === 1 ? "outline" : "secondary"}>{actionTypeLabels[row.original.actionType] ?? "Other"}</Badge> }),
  column.accessor((row) => row.when ?? "", { id: "when", header: "Date and time", size: 190, cell: ({ row }) => formatDateTime(row.original.when) ?? "–" }),
  column.accessor((row) => row.ipAddress ?? "", { id: "ip", header: "From", size: 150, cell: ({ row }) => row.original.ipAddress ?? <span className="text-muted-foreground">–</span> }),
]);

/** Who did what and when, newest first as the server keeps it. It can be narrowed by date and searched; nothing here can be changed. */
export function AuditTrailPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("the audit trail", busy);
  const form = useForm<Filter>({ defaultValues: { range: null } });
  const range = useWatch({ control: form.control, name: "range" });
  const from = range?.from ?? null;
  const to = range?.to ?? from;
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${from?.getTime()}|${to?.getTime()}` });
  const query = useGetApiV1ActivityLogQuery({ ...audit, page: table.page, pageSize: table.pageSize, ...(search.trim() ? { searchQuery: search } : {}), ...(from && to ? { startDate: utcBoundary(from), endDate: utcBoundary(to, true) } : {}) });
  const parsed = useMemo(() => query.data ? activityRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">IT SUPPORT</p><h1 className="text-xl font-semibold">Audit trail</h1></div>
      <div className="w-72"><FormWizard form={form} fields={fields} /></div>
    </div>
    <ServerDataTable label="Audit trail" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned entries the app could not read." : null}
      emptyTitle={search.trim() || from ? "Nothing matches" : "No activity recorded"} emptyDescription={search.trim() || from ? "Try another search or a wider period." : "Actions appear here as people use the system."} />
  </section>;
}
