import { useCallback, useMemo, useState } from "react";
import { Ban, CheckCheck, Pencil, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";
import { migrationAudit, stockMigrationApi, type LineDto, type LineStatus, type MigrationDto } from "../api/stock-migration-api";
import { isDraft, lineStatus, lineStatusLabels, materialLabel, migrationPermission, statusCounts } from "../lib/stock-migration";
import { StockMigrationLineDialog } from "./stock-migration-line-dialog";

const column = dataTableColumns<LineDto>();
const dash = <span className="text-muted-foreground">–</span>;
const badgeVariant: Record<LineStatus, "default" | "secondary" | "destructive" | "outline"> = { 0: "default", 1: "secondary", 2: "destructive", 3: "outline", 4: "outline" };
const allSheets = "all";

function Messages({ line }: { line: LineDto }) {
  return <ul className="space-y-0.5 text-xs">
    {(line.blockers ?? []).map((text) => <li key={`b${text}`} className="break-words text-destructive">{text}</li>)}
    {(line.warnings ?? []).map((text) => <li key={`w${text}`} className="break-words text-amber-700 dark:text-amber-400">{text}</li>)}
    {(line.corrections ?? []).map((text) => <li key={`c${text}`} className="break-words text-muted-foreground">{text}</li>)}
  </ul>;
}

/** The sheet's rows, filtered by status and tab, with corrections one row or many at a time. */
export function StockMigrationLines({ migration, shelves }: { migration: MigrationDto; shelves: readonly SelectOption[] }) {
  const id = migration.id ?? "";
  const editable = isDraft(migration);
  const [status, setStatus] = useState<LineStatus | null>((migration.blocked ?? 0) > 0 ? lineStatus.blocked : null);
  const [sheet, setSheet] = useState(allSheets);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<LineDto | null>(null);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(migrationPermission);
  const lines = stockMigrationApi.useLinesQuery({ ...migrationAudit, id, pageSize: 1000, ...(status === null ? {} : { status }),
    ...(sheet === allSheets ? {} : { sheet }), ...(search.trim() ? { search: search.trim() } : {}) });
  const [bulk, bulkState] = stockMigrationApi.useBulkUpdateMutation();

  const apply = useCallback(async (change: { shelfId?: string; excluded?: boolean }, ids: string[]) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const result = await bulk({ ...migrationAudit, id, domainEntitiesMaterialsStockMigrationsBulkUpdateStockMigrationLinesRequest: { lineIds: ids, ...change } });
    if ("error" in result) setMessage(apiErrorMessage(result.error)); else setSelected(new Set());
  }, [bulk, id, permission]);

  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.rowNumber ?? 0, { id: "row", header: "Row", size: 90, cell: ({ row }) =>
      <div><div className="font-medium">{row.original.rowNumber}</div><div className="text-xs text-muted-foreground">{row.original.sheet}</div></div> }),
    column.accessor((row) => materialLabel(row).code, { id: "material", header: "Material", size: 260, cell: ({ row }) => {
      const material = materialLabel(row.original);
      const sheetName = row.original.sheetMaterialName;
      return <div className="min-w-0"><div className="font-medium">{material.code || dash}</div><div className="break-words text-xs">{material.name}</div>
        {row.original.resolvedMaterialName && sheetName && sheetName !== material.name ? <div className="break-words text-xs text-muted-foreground">Sheet: {sheetName}</div> : null}</div>; } }),
    column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => <span className="break-all">{row.original.batchNumber || dash}</span> }),
    column.accessor((row) => row.resolvedShelf ?? row.shelfName ?? "", { id: "shelf", header: "Shelf", size: 170, cell: ({ row }) => row.original.resolvedShelf
      ? <div><div>{row.original.resolvedShelf}</div><div className="text-xs text-muted-foreground">{row.original.resolvedWarehouse}</div></div>
      : <span className="text-muted-foreground">{row.original.shelfName ? `${row.original.shelfName} (not found)` : "None"}</span> }),
    column.accessor((row) => row.quantity ?? -1, { id: "quantity", header: "Quantity", size: 170, cell: ({ row }) => {
      const sheetValue = row.original.quantityInSheet;
      const loaded = toLargestUnit(row.original.quantity, row.original.unit, "calculated");
      return <div><div>{loaded?.text ?? dash}</div>{sheetValue !== null && sheetValue !== undefined
        ? <div className="text-xs text-muted-foreground">Sheet: {formatQuantityNumber(sheetValue, "entered")} {row.original.sheetUnit ?? ""}</div> : null}</div>; } }),
    column.accessor((row) => row.expiryDate ?? "", { id: "expiry", header: "Expiry", size: 110, cell: ({ row }) => formatMonthYear(row.original.expiryDate) ?? dash }),
    column.accessor((row) => row.status ?? 0, { id: "status", header: "Status", cell: ({ row }) => {
      const value = row.original.status ?? 0;
      return <div className="min-w-0 space-y-1"><Badge variant={badgeVariant[value]}>{lineStatusLabels[value]}</Badge><Messages line={row.original} /></div>; } }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for row ${row.original.rowNumber} of ${row.original.sheet}`}
      items={editable ? [
        { id: "edit", label: "Correct row", icon: Pencil, require: migrationPermission, onSelect: () => setEditing(row.original) },
        row.original.excluded
          ? { id: "include", label: "Include row", icon: Undo2, require: migrationPermission, onSelect: () => void apply({ excluded: false }, [row.original.id ?? ""]) }
          : { id: "exclude", label: "Leave row out", icon: Ban, require: migrationPermission, onSelect: () => void apply({ excluded: true }, [row.original.id ?? ""]) },
      ] : []} /> }),
  ]), [apply, editable]);

  const ids = [...selected];
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant={status === null ? "default" : "outline"} onClick={() => setStatus(null)}>All ({migration.total ?? 0})</Button>
      {statusCounts(migration).map((item) => <Button key={item.status} type="button" size="sm" variant={status === item.status ? "default" : "outline"}
        onClick={() => { setStatus(item.status); setSelected(new Set()); }}>{item.label} ({item.count})</Button>)}
      <Select value={sheet} onValueChange={setSheet}><SelectTrigger aria-label="Tab" className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value={allSheets}>All tabs</SelectItem>{(migration.sheets ?? []).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>
      <Input aria-label="Search rows" placeholder="Search code, name, batch or GRN" className="w-64" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    {editable && ids.length > 0 ? <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
      <span>{ids.length} row(s) selected</span>
      <Select onValueChange={(shelfId) => void apply({ shelfId }, ids)} disabled={bulkState.isLoading}><SelectTrigger aria-label="Put selected rows on shelf" className="w-64"><SelectValue placeholder="Put them on shelf…" /></SelectTrigger>
        <SelectContent>{shelves.map((shelf) => <SelectItem key={shelf.value} value={shelf.value}>{shelf.label}</SelectItem>)}</SelectContent></Select>
      <Button type="button" size="sm" variant="outline" disabled={bulkState.isLoading} onClick={() => void apply({ excluded: true }, ids)}><Ban />Leave out</Button>
      <Button type="button" size="sm" variant="outline" disabled={bulkState.isLoading} onClick={() => void apply({ excluded: false }, ids)}><CheckCheck />Include</Button>
    </div> : null}
    {message ? <p role="alert" className="break-words text-sm text-destructive">{message}</p> : null}
    <ClientDataTable label="Sheet rows" columns={columns} rows={lines.data?.data} getRowId={(row) => row.id ?? ""} initialPageSize={50} loading={lines.isLoading} refreshing={lines.isFetching}
      error={lines.error ? apiErrorMessage(lines.error) : null} onRetry={() => void lines.refetch()} fill={false}
      selection={editable ? { selected, onChange: setSelected } : undefined} onRowOpen={editable ? setEditing : undefined}
      emptyTitle="No rows" emptyDescription="No row matches these filters." />
    {editing ? <StockMigrationLineDialog migrationId={id} line={editing} shelves={shelves} onClose={() => setEditing(null)} /> : null}
  </div>;
}
