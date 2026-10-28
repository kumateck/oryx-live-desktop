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
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { compareNumbers } from "@/shared/specifications/specification-rules";
import { useApproveSpecification, VerifiableRecord } from "@/shared/specifications/use-approve-specification";
import { materialArdChanged, materialArdsApi } from "../api/material-ards-api";
import { ardPermissions, detailPath, kindName } from "../lib/material-ards";
import { MaterialArdDialog } from "./material-ard-dialog";

const column = dataTableColumns<ArdRecord>();
type Open = { action: "create" } | { action: "edit" | "remove" | "approve"; row: ArdRecord };

/** Raw and packaging material analytical raw data, each kind behind its own permission. */
export function MaterialArdListPage() {
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(ardPermissions.view);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("material analytical raw data", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${String(kind)}` });
  const query = materialArdsApi.useGetApiV1MaterialArdQuery({ ...ardAudit, materialKind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? ardRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => compareNumbers(a.specNumber ?? "", b.specNumber ?? "")) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [open, setOpen] = useState<Open | null>(null);
  const [remove] = materialArdsApi.useDeleteApiV1MaterialArdByIdMutation();
  const approval = useApproveSpecification(VerifiableRecord.MaterialArd, materialArdChanged, ardAudit);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const shown: MaterialKind = kind ?? 0;

  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.item?.name ?? "", { id: "material", header: "Material", cell: ({ row }) => <span className="break-words"><span className="font-medium">{row.original.item?.name ?? "–"}</span>
      {row.original.item?.code ? <span className="block text-xs text-muted-foreground">{row.original.item.code}</span> : null}</span> }),
    column.accessor((row) => row.stp?.number ?? "", { id: "stp", header: "STP", size: 170, cell: ({ row }) => row.original.stp?.number ?? "–" }),
    column.accessor((row) => row.specNumber ?? "", { id: "spec", header: "Specification", size: 170, cell: ({ row }) => row.original.specNumber ?? "–" }),
    column.accessor((row) => row.form?.name ?? "", { id: "form", header: "Template", cell: ({ row }) => <span className="break-words">{row.original.form?.name ?? "–"}</span> }),
    column.accessor("isVerified", { header: "Approved", size: 120, cell: ({ row }) => row.original.isVerified ? <Badge><BadgeCheck />Approved</Badge> : <Badge variant="outline">Not approved</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.item?.name ?? "this record"}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: ardPermissions.edit[shown], onSelect: () => setOpen({ action: "edit", row: row.original }) },
      !row.original.isVerified && { id: "approve", label: "Approve", icon: BadgeCheck, require: ardPermissions.verify[shown], onSelect: () => setOpen({ action: "approve", row: row.original }) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: ardPermissions.remove[shown], onSelect: () => setOpen({ action: "remove", row: row.original }) },
    ]} /> }),
  ]), [shown]);

  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Material analytical raw data</h1></div>
      <div className="flex flex-wrap items-center gap-2"><KindSwitch tabs={tabs} kind={kind} onSelect={select} />
        {kind !== null ? <PermissionGuard require={ardPermissions.create[kind]}><Button size="sm" onClick={() => setOpen({ action: "create" })}><Plus />New {kindName(kind)} material ARD</Button></PermissionGuard> : null}</div></div>
    <ServerDataTable label="Material analytical raw data" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id, shown))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned records the app could not read." : null}
      emptyTitle={search.trim() ? "No records match this search" : `No ${kindName(shown)} material analytical raw data`} emptyDescription={search.trim() ? "Search by material, STP or specification." : "Create a record once the material has an STP and a specification."} />
    {open?.action === "create" && kind !== null ? <MaterialArdDialog kind={kind} editing={null} onClose={() => setOpen(null)} /> : null}
    {open?.action === "edit" ? <MaterialArdDialog kind={shown} editing={open.row} onClose={() => setOpen(null)} /> : null}
    {open?.action === "approve" ? <ConfirmActionDialog require={ardPermissions.verify[shown]} destructive={false} title={`Approve the analytical raw data for ${open.row.item?.name ?? "this material"}?`}
      description="Approving marks the worksheet as checked for use in testing." confirmLabel="Approve" busyLabel="Approving…" onClose={() => setOpen(null)}
      onConfirm={async () => { const error = await approval.approve(open.row.id); if (!error) setOpen(null); return error; }} /> : null}
    {open?.action === "remove" ? <ConfirmActionDialog require={ardPermissions.remove[shown]} title={`Delete the analytical raw data for ${open.row.item?.name ?? "this material"}?`}
      description="Batches of this material can no longer be tested until a new record is made. This cannot be undone." confirmLabel="Delete" busyLabel="Deleting…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ ...ardAudit, id: open.row.id }); if ("error" in result) return apiErrorMessage(result.error); setOpen(null); return null; }} /> : null}
  </section>;
}
