import { useMemo, useState } from "react";
import { Droplets, Plus, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { routinesApi } from "../api/routines-api";
import { originLabel, RoutineStatus, routinePath, routinePermissions, setupPath, statusLabel, typeLabel, waterPath, type Execution } from "../lib/routines";
import { RoutineDialog } from "./routine-dialog";

const column = dataTableColumns<Execution>();
const tone = (status: number) => status === RoutineStatus.Approved ? "default" : status === RoutineStatus.Rejected ? "destructive" : status === RoutineStatus.Planned ? "outline" : "secondary";
const columns = column.columns([
  column.accessor("code", { header: "Routine", size: 170, cell: ({ row }) => <span className="font-medium">{row.original.code}</span> }),
  column.accessor((row) => typeLabel(row.type), { id: "type", header: "Type" }),
  column.accessor((row) => originLabel(row.origin), { id: "origin", header: "Origin" }),
  column.accessor((row) => row.routineDate ?? "", { id: "date", header: "Date / period", size: 190, cell: ({ row }) => <span>{formatDate(row.original.routineDate) ?? "–"}
    {row.original.periodStart ? <span className="block text-xs text-muted-foreground">{formatDate(row.original.periodStart)} – {formatDate(row.original.periodEnd) ?? ""}</span> : null}</span> }),
  column.accessor((row) => row.samples.length, { id: "samples", header: "Samples", size: 100 }),
  column.accessor("status", { header: "Status", size: 130, cell: ({ row }) => <Badge variant={tone(row.original.status)}>{statusLabel(row.original.status)}</Badge> }),
]);

/** Water and environmental monitoring routines, scheduled and emergency. */
export function RoutineListPage() {
  const navigate = useNavigate();
  const query = routinesApi.useListRoutinesQuery(undefined);
  const search = usePageSearch("routines", query.isFetching);
  const [creating, setCreating] = useState(false);
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? []).filter((row) => !term || [row.code, typeLabel(row.type), row.emergencyTrigger].some((value) => value?.toLowerCase().includes(term)));
  }, [query.data, search]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Routine tests</h1>
      <p className="text-sm text-muted-foreground">Water and environmental monitoring, including emergency events.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <PermissionGuard require={routinePermissions.waterView}><Button asChild size="sm" variant="outline"><Link to={waterPath}><Droplets />Water coverage</Link></Button></PermissionGuard>
        <PermissionGuard require={routinePermissions.setupView}><Button asChild size="sm" variant="outline"><Link to={setupPath}><Settings2 />Schedules and ARDs</Link></Button></PermissionGuard>
        <PermissionGuard require={routinePermissions.create}><Button size="sm" onClick={() => setCreating(true)}><Plus />New routine</Button></PermissionGuard>
      </div></div>
    <ListDataTable label="Routine tests" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : null} onRowOpen={(row) => void navigate(routinePath(row.id))}
      emptyTitle={search.trim() ? "No routines match this search" : "No routines yet"} emptyDescription={search.trim() ? "Search by routine code or type." : "Create a scheduled or emergency routine."} />
    {creating ? <RoutineDialog onClose={() => setCreating(false)} /> : null}
  </section>;
}
