import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { toLargestUnit } from "@/shared/units/quantity";
import { migrationAudit, stockMigrationApi, type ComparisonDto } from "../api/stock-migration-api";
import { comparisonChange, type ComparisonChange } from "../lib/stock-migration";

const column = dataTableColumns<ComparisonDto>();
const changeLabels: Record<ComparisonChange, string> = { removed: "Goes to zero", added: "New", changed: "Changes", same: "Same" };
const filters = [{ id: "changes", label: "Changes" }, { id: "removed", label: "Going to zero" }, { id: "all", label: "All" }] as const;
type Filter = (typeof filters)[number]["id"];

function Quantity({ value, unit, batches }: { value: number | undefined; unit: string | null | undefined; batches: number | undefined }) {
  if (!value) return <span className="text-muted-foreground">–</span>;
  return <div><div>{toLargestUnit(value, unit, "calculated")?.text}</div><div className="text-xs text-muted-foreground">{batches} batch{batches === 1 ? "" : "es"}</div></div>;
}

/** Each material's storage stock now against what approval leaves; materials the sheet leaves out go to zero. */
export function StockMigrationComparison({ migrationId, approved }: { migrationId: string; approved: boolean }) {
  const [filter, setFilter] = useState<Filter>("changes");
  const comparison = stockMigrationApi.useComparisonQuery({ ...migrationAudit, id: migrationId });
  const rows = useMemo(() => (comparison.data ?? []).filter((row) => {
    const change = comparisonChange(row);
    return filter === "all" || (filter === "removed" ? change === "removed" : change !== "same");
  }), [comparison.data, filter]);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.code ?? "", { id: "material", header: "Material", cell: ({ row }) =>
      <div className="min-w-0"><div className="font-medium">{row.original.code}</div><div className="break-words text-xs">{row.original.name}</div></div> }),
    column.accessor((row) => row.kind ?? 0, { id: "kind", header: "Kind", size: 110, cell: ({ row }) => row.original.kind === 1 ? "Packaging" : "Raw" }),
    column.accessor((row) => row.current ?? 0, { id: "current", header: approved ? "Before" : "Now", size: 170, cell: ({ row }) =>
      <Quantity value={row.original.current} unit={row.original.unit} batches={row.original.currentBatches} /> }),
    column.accessor((row) => row.new ?? 0, { id: "new", header: approved ? "Loaded" : "After approval", size: 170, cell: ({ row }) =>
      <Quantity value={row.original.new} unit={row.original.unit} batches={row.original.newBatches} /> }),
    column.accessor((row) => comparisonChange(row), { id: "change", header: "Change", size: 130, cell: ({ row }) => {
      const change = comparisonChange(row.original);
      return <Badge variant={change === "removed" ? "destructive" : change === "same" ? "outline" : "secondary"}>{changeLabels[change]}</Badge>; } }),
  ]), [approved]);
  const removed = (comparison.data ?? []).filter((row) => comparisonChange(row) === "removed").length;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((item) => <Button key={item.id} type="button" size="sm" variant={filter === item.id ? "default" : "outline"} onClick={() => setFilter(item.id)}>{item.label}</Button>)}
      {removed > 0 && !approved ? <span className="text-sm text-destructive">{removed} material(s) have stock now but are not in the sheet; approval sets them to zero.</span> : null}
    </div>
    <ClientDataTable label="Stock before and after" columns={columns} rows={rows} getRowId={(row) => row.materialId ?? ""} initialPageSize={50} loading={comparison.isLoading}
      refreshing={comparison.isFetching} error={comparison.error ? apiErrorMessage(comparison.error) : null} onRetry={() => void comparison.refetch()} fill={false}
      emptyTitle="Nothing to show" emptyDescription="No material matches this filter." />
  </div>;
}
