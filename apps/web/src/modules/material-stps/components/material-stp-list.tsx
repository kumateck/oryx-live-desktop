import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { compareNumbers } from "@/shared/specifications/specification-rules";
import { stpAudit } from "@/shared/stp/stp-document-api";
import { stpRowsSchema, type Stp } from "@/shared/stp/stp-schema";
import { materialStpsApi } from "../api/material-stps-api";
import { detailPath, documentPath, kindName, stpPermissions } from "../lib/material-stps";
import { MaterialStpDialog } from "./material-stp-dialog";

const column = dataTableColumns<Stp>();
type Open = { action: "create" } | { action: "edit" | "remove"; row: Stp };

/** Raw and packaging material STPs, each kind behind its own permission. */
export function MaterialStpListPage() {
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(stpPermissions.view);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("material STPs", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${String(kind)}` });
  const query = materialStpsApi.useGetApiV1MaterialStpsQuery({ ...stpAudit, materialKind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? stpRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => compareNumbers(a.number, b.number)) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [open, setOpen] = useState<Open | null>(null);
  const [remove] = materialStpsApi.useDeleteApiV1MaterialStpsByIdMutation();
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const shown: MaterialKind = kind ?? 0;

  const columns = useMemo(() => column.columns([
    column.accessor("number", { header: "STP number", size: 180, cell: ({ row }) => <span className="font-medium">{row.original.number}</span> }),
    column.accessor((row) => row.item?.code ?? "", { id: "code", header: "Material code", size: 150, cell: ({ row }) => row.original.item?.code ?? "–" }),
    column.accessor((row) => row.item?.name ?? "", { id: "material", header: "Material", cell: ({ row }) => <span className="break-words">{row.original.item?.name ?? "–"}</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.number}`} items={[
      { id: "document", label: "Open document", icon: FileText, require: stpPermissions.view[shown], to: documentPath(row.original.id, shown) },
      { id: "edit", label: "Edit STP", icon: Pencil, require: stpPermissions.edit[shown], onSelect: () => setOpen({ action: "edit", row: row.original }) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: stpPermissions.remove[shown], onSelect: () => setOpen({ action: "remove", row: row.original }) },
    ]} /> }),
  ]), [shown]);

  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Material standard test procedures</h1></div>
      <div className="flex flex-wrap items-center gap-2"><KindSwitch tabs={tabs} kind={kind} onSelect={select} />
        {kind !== null ? <PermissionGuard require={stpPermissions.create[kind]}><Button size="sm" onClick={() => setOpen({ action: "create" })}><Plus />New {kindName(kind)} STP</Button></PermissionGuard> : null}</div></div>
    <ServerDataTable label="Material STPs" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id, shown))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned STPs the app could not read." : null}
      emptyTitle={search.trim() ? "No STPs match this search" : `No ${kindName(shown)} material STPs`} emptyDescription={search.trim() ? "Search by STP number or material." : "Create an STP and attach its controlled document."} />
    {open?.action === "create" && kind !== null ? <MaterialStpDialog kind={kind} editing={null} onClose={() => setOpen(null)} /> : null}
    {open?.action === "edit" ? <MaterialStpDialog kind={shown} editing={open.row} onClose={() => setOpen(null)} /> : null}
    {open?.action === "remove" ? <ConfirmActionDialog require={stpPermissions.remove[shown]} title={`Delete ${open.row.number}?`}
      description={`The STP for ${open.row.item?.name ?? "this material"} is deleted. Analytical raw data that uses it may stop working. This cannot be undone.`} confirmLabel="Delete STP" busyLabel="Deleting…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ ...stpAudit, id: open.row.id }); if ("error" in result) return apiErrorMessage(result.error); setOpen(null); return null; }} /> : null}
  </section>;
}
