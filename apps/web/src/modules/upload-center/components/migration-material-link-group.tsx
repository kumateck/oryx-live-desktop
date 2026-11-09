import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";
import type { MaterialLinkDto, MigrationDto } from "../api/stock-migration-api";
import { useMigrationMaterialLinks } from "../hooks/use-migration-material-links";
import { canLinkMaterial, type LinkKind } from "../lib/migration-material-links";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

const column = dataTableColumns<MaterialLinkDto>();
function Level({ value, unit }: { value: number | undefined; unit: string | null | undefined }) {
  return <div className="tabular-nums">
    <div>{toLargestUnit(value, unit, "calculated")?.text ?? "–"}</div>
    {value !== undefined && (unit === "mg" || unit === "ml")
      ? <div className="text-xs text-muted-foreground">{formatQuantityNumber(value, "calculated")} {unit}</div> : null}
  </div>;
}
const columns = column.columns([
  column.accessor((row) => row.code ?? "", { id: "material", header: "Material", size: 220, cell: ({ row }) => <div className="min-w-0 break-words">
    <div className="font-medium">{row.original.code}</div><div>{row.original.name}</div>
    {row.original.issue ? <p className="text-xs text-destructive">{row.original.issue}</p> : null}
  </div> }),
  column.accessor((row) => row.unitName ?? "", { id: "unit", header: "Selected unit", size: 130, cell: ({ row }) =>
    <span>{row.original.uoMId ? `${row.original.unitName} (${row.original.unitSymbol})` : "Unavailable"}</span> }),
  ...([["minimumStockLevel", "Minimum"], ["reOrderLevel", "Re-order"], ["maximumStockLevel", "Maximum"]] as const).map(([key, header]) =>
    column.accessor((row) => row[key] ?? 0, { id: key, header, size: 130, cell: ({ row }) =>
      row.original.issue ? "–" : <Level value={row.original[key]} unit={row.original.unitSymbol} /> })),
]);

export function MigrationMaterialLinkGroup({ migration, kind, busy, onBusy }: {
  migration: MigrationDto; kind: LinkKind; busy: boolean; onBusy: (value: boolean) => void;
}) {
  const state = useMigrationMaterialLinks(migration, kind, onBusy);
  const label = kind === 0 ? "Raw materials" : "Packaging materials";
  const eligible = state.rows.filter(canLinkMaterial);
  return <section aria-label={label} className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold">{label}</h2>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy || state.query.isFetching} onClick={() => void state.query.refetch()}>Refresh preview</Button>
        <Button size="sm" variant="outline" disabled={busy || state.query.isFetching || eligible.length === 0}
          onClick={() => state.setSelected(new Set(eligible.flatMap((row) => row.materialId ? [row.materialId] : [])))}>Select all eligible</Button>
      </div>
    </div>
    <ClientDataTable label={label} columns={columns} rows={state.rows} getRowId={(row) => row.materialId ?? ""} fill={false}
      loading={state.query.isLoading} refreshing={state.query.isFetching} initialPageSize={10} pageSizes={[10, 20, 50]}
      error={state.query.error ? apiErrorMessage(state.query.error) : null} onRetry={() => void state.query.refetch()}
      selection={{ selected: state.selected, onChange: state.setSelected, isSelectable: (row) => !busy && state.enabled && canLinkMaterial(row) }}
      emptyTitle="No missing materials" emptyDescription="No materials need linking in this group. Existing department links are preserved." />
    {state.error ? <p role="alert" className="break-words text-destructive">{state.error} Refresh the preview before trying again.</p> : null}
    {state.result ? <p role="status" className="break-words">{state.result}</p> : null}
    {state.chosen.length > 1000 ? <p role="alert">Select up to 1,000 materials per request.</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">{state.chosen.length} selected. Select one material to link it individually.</p>
      <Button size="sm" disabled={busy || state.query.isFetching || Boolean(state.query.error) || !state.enabled || state.chosen.length === 0 || state.chosen.length > 1000} onClick={() => void state.link()}>
        {busy ? <Spinner /> : null}Link selected {kind === 0 ? "raw" : "packaging"} materials ({state.chosen.length})</Button>
    </div>
  </section>;
}
