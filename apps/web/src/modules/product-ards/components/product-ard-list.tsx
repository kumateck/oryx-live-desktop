import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ardAudit, ardRowsSchema, type ArdRecord } from "@/shared/ard-records/ard-record";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { compareNumbers, testStageLabel } from "@/shared/specifications/specification-rules";
import { useApproveSpecification, VerifiableRecord } from "@/shared/specifications/use-approve-specification";
import { productArdChanged, productArdsApi } from "../api/product-ards-api";
import { ardPermissions, detailPath } from "../lib/product-ards";
import { ProductArdDialog } from "./product-ard-dialog";

const column = dataTableColumns<ArdRecord>();
type Open = { action: "create" } | { action: "edit" | "remove" | "approve"; row: ArdRecord };

/** Every product analytical raw data record, one per product and stage. */
export function ProductArdListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("product analytical raw data", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = productArdsApi.useGetApiV1ProductArdQuery({ ...ardAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? ardRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => compareNumbers(a.specNumber ?? "", b.specNumber ?? "")) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [open, setOpen] = useState<Open | null>(null);
  const [remove] = productArdsApi.useDeleteApiV1ProductArdByIdMutation();
  const approval = useApproveSpecification(VerifiableRecord.ProductArd, productArdChanged, ardAudit);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.item?.name ?? "", { id: "product", header: "Product", cell: ({ row }) => <span className="break-words"><span className="font-medium">{row.original.item?.name ?? "–"}</span>
      {row.original.item?.code ? <span className="block text-xs text-muted-foreground">{row.original.item.code}</span> : null}</span> }),
    column.accessor((row) => testStageLabel(row.stage), { id: "stage", header: "Stage", size: 120 }),
    column.accessor((row) => row.stp?.number ?? "", { id: "stp", header: "STP", size: 170, cell: ({ row }) => row.original.stp?.number ?? "–" }),
    column.accessor((row) => row.specNumber ?? "", { id: "spec", header: "Specification", size: 170, cell: ({ row }) => row.original.specNumber ?? "–" }),
    column.accessor((row) => row.form?.name ?? "", { id: "form", header: "Template", cell: ({ row }) => <span className="break-words">{row.original.form?.name ?? "–"}</span> }),
    column.accessor("isVerified", { header: "Approved", size: 120, cell: ({ row }) => row.original.isVerified ? <Badge><BadgeCheck />Approved</Badge> : <Badge variant="outline">Not approved</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.item?.name ?? "this record"}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: ardPermissions.edit, onSelect: () => setOpen({ action: "edit", row: row.original }) },
      !row.original.isVerified && { id: "approve", label: "Approve", icon: BadgeCheck, require: ardPermissions.verify, onSelect: () => setOpen({ action: "approve", row: row.original }) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: ardPermissions.remove, onSelect: () => setOpen({ action: "remove", row: row.original }) },
    ]} /> }),
  ]), []);

  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Product analytical raw data</h1></div>
      <PermissionGuard require={ardPermissions.create}><Button size="sm" onClick={() => setOpen({ action: "create" })}><Plus />New product ARD</Button></PermissionGuard></div>
    <ServerDataTable label="Product analytical raw data" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned records the app could not read." : null}
      emptyTitle={search.trim() ? "No records match this search" : "No product analytical raw data"} emptyDescription={search.trim() ? "Search by product, STP or specification." : "Create a record once the product has an STP and a specification for the stage."} />
    {open?.action === "create" ? <ProductArdDialog editing={null} onClose={() => setOpen(null)} /> : null}
    {open?.action === "edit" ? <ProductArdDialog editing={open.row} onClose={() => setOpen(null)} /> : null}
    {open?.action === "approve" ? <ConfirmActionDialog require={ardPermissions.verify} destructive={false} title={`Approve the analytical raw data for ${open.row.item?.name ?? "this product"}?`}
      description="Approving marks the worksheet as checked for use in testing." confirmLabel="Approve" busyLabel="Approving…" onClose={() => setOpen(null)}
      onConfirm={async () => { const error = await approval.approve(open.row.id); if (!error) setOpen(null); return error; }} /> : null}
    {open?.action === "remove" ? <ConfirmActionDialog require={ardPermissions.remove} title={`Delete the analytical raw data for ${open.row.item?.name ?? "this product"}?`}
      description="Batches of this product stage can no longer be tested until a new record is made. This cannot be undone." confirmLabel="Delete" busyLabel="Deleting…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ ...ardAudit, id: open.row.id }); if ("error" in result) return apiErrorMessage(result.error); setOpen(null); return null; }} /> : null}
  </section>;
}
