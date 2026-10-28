import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { compareNumbers } from "@/shared/specifications/specification-rules";
import { stpAudit } from "@/shared/stp/stp-document-api";
import { stpRowsSchema, type Stp } from "@/shared/stp/stp-schema";
import { productStpsApi } from "../api/product-stps-api";
import { detailPath, documentPath, stpPermissions } from "../lib/product-stps";
import { ProductStpDialog } from "./product-stp-dialog";

const column = dataTableColumns<Stp>();
type Open = { action: "create" } | { action: "edit" | "remove"; row: Stp };

/** Every product STP, one row per product it covers. */
export function ProductStpListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("product STPs", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = productStpsApi.useGetApiV1ProductStpsQuery({ ...stpAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? stpRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => compareNumbers(a.number, b.number)) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [open, setOpen] = useState<Open | null>(null);
  const [remove] = productStpsApi.useDeleteApiV1ProductStpsByIdMutation();
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  const columns = useMemo(() => column.columns([
    column.accessor("number", { header: "STP number", size: 180, cell: ({ row }) => <span className="font-medium">{row.original.number}</span> }),
    column.accessor((row) => row.item?.code ?? "", { id: "code", header: "Product code", size: 150, cell: ({ row }) => row.original.item?.code ?? "–" }),
    column.accessor((row) => row.item?.name ?? "", { id: "product", header: "Product", cell: ({ row }) => <span className="break-words">{row.original.item?.name ?? "–"}</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.number}`} items={[
      { id: "document", label: "Open document", icon: FileText, require: stpPermissions.view, to: documentPath(row.original.id) },
      { id: "edit", label: "Edit STP", icon: Pencil, require: stpPermissions.edit, onSelect: () => setOpen({ action: "edit", row: row.original }) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: stpPermissions.remove, onSelect: () => setOpen({ action: "remove", row: row.original }) },
    ]} /> }),
  ]), []);

  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Product standard test procedures</h1></div>
      <PermissionGuard require={stpPermissions.create}><Button size="sm" onClick={() => setOpen({ action: "create" })}><Plus />New product STP</Button></PermissionGuard></div>
    <ServerDataTable label="Product STPs" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned STPs the app could not read." : null}
      emptyTitle={search.trim() ? "No STPs match this search" : "No product STPs"} emptyDescription={search.trim() ? "Search by STP number or product." : "Create an STP and attach its controlled document."} />
    {open?.action === "create" ? <ProductStpDialog editing={null} onClose={() => setOpen(null)} /> : null}
    {open?.action === "edit" ? <ProductStpDialog editing={open.row} onClose={() => setOpen(null)} /> : null}
    {open?.action === "remove" ? <ConfirmActionDialog require={stpPermissions.remove} title={`Delete ${open.row.number}?`}
      description={`The STP for ${open.row.item?.name ?? "this product"} is deleted. Analytical raw data that uses it may stop working. This cannot be undone.`} confirmLabel="Delete STP" busyLabel="Deleting…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ ...stpAudit, id: open.row.id }); if ("error" in result) return apiErrorMessage(result.error); setOpen(null); return null; }} /> : null}
  </section>;
}
