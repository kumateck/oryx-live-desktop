import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { compareNumbers, testStageLabel } from "@/shared/specifications/specification-rules";
import { specificationRowsSchema, type Specification } from "@/shared/specifications/specification-schema";
import { useApproveSpecification, VerifiableSpecification } from "@/shared/specifications/use-approve-specification";
import { productSpecificationChanged, productSpecificationsApi } from "../api/product-specifications-api";
import { audit, completePath, completePermission, createPath, detailPath, editPath, specPermissions } from "../lib/product-specifications";

const column = dataTableColumns<Specification>();
type Pending = { action: "approve" | "remove"; row: Specification };

/** Every product specification, one row per product and stage. */
export function ProductSpecificationListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("product specifications", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = productSpecificationsApi.useGetApiV1ProductSpecificationsQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? specificationRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => compareNumbers(a.number, b.number)) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [pending, setPending] = useState<Pending | null>(null);
  const [remove] = productSpecificationsApi.useDeleteApiV1ProductSpecificationsByIdMutation();
  const approval = useApproveSpecification(VerifiableSpecification.Product, productSpecificationChanged, audit);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.item?.name ?? "", { id: "product", header: "Product", cell: ({ row }) => <span className="break-words font-medium">{row.original.item?.name ?? "–"}</span> }),
    column.accessor((row) => row.item?.code ?? "", { id: "code", header: "Product code", size: 140, cell: ({ row }) => row.original.item?.code ?? "–" }),
    column.accessor((row) => testStageLabel(row.testStage), { id: "stage", header: "Stage", size: 120 }),
    column.accessor("number", { header: "Specification", size: 170 }),
    column.accessor((row) => row.effectiveDate ?? "", { id: "effective", header: "Effective", size: 120, cell: ({ row }) => formatDate(row.original.effectiveDate) ?? "–" }),
    column.accessor((row) => row.reviewDate ?? "", { id: "review", header: "Revision date", size: 130, cell: ({ row }) => formatDate(row.original.reviewDate) ?? "–" }),
    column.accessor((row) => row.revisionNumber ?? "", { id: "revision", header: "Revision", size: 100, cell: ({ row }) => row.original.revisionNumber ?? "–" }),
    column.accessor((row) => row.supersedesNumber ?? "", { id: "supersedes", header: "Supersedes", size: 130, cell: ({ row }) => row.original.supersedesNumber ?? "–" }),
    column.accessor("isVerified", { header: "Approved", size: 120, cell: ({ row }) => row.original.isVerified ? <Badge><BadgeCheck />Approved</Badge> : <Badge variant="outline">Not approved</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.number}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: specPermissions.edit, to: editPath(row.original.id) },
      { id: "complete", label: "Set test references", icon: ClipboardCheck, require: completePermission, to: completePath(row.original.id) },
      !row.original.isVerified && { id: "approve", label: "Approve", icon: BadgeCheck, require: specPermissions.verify, onSelect: () => setPending({ action: "approve", row: row.original }) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: specPermissions.remove, onSelect: () => setPending({ action: "remove", row: row.original }) },
    ]} /> }),
  ]), []);

  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Product specifications</h1></div>
      <PermissionGuard require={specPermissions.create}><Button asChild size="sm"><Link to={createPath}><Plus />New specification</Link></Button></PermissionGuard></div>
    <ServerDataTable label="Product specifications" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned specifications the app could not read." : null}
      emptyTitle={search.trim() ? "No specifications match this search" : "No product specifications"} emptyDescription={search.trim() ? "Search by specification number or product." : "Create a specification to set how a product is tested at each stage."} />
    {pending?.action === "approve" ? <ConfirmActionDialog require={specPermissions.verify} destructive={false} title={`Approve ${pending.row.number}?`}
      description="Approving marks the specification as checked. Analysts test against it from then on." confirmLabel="Approve" busyLabel="Approving…" onClose={() => setPending(null)}
      onConfirm={async () => { const error = await approval.approve(pending.row.id); if (!error) setPending(null); return error; }} /> : null}
    {pending?.action === "remove" ? <ConfirmActionDialog require={specPermissions.remove} title={`Delete ${pending.row.number}?`}
      description="The specification is removed for every product linked to it. This cannot be undone." confirmLabel="Delete specification" busyLabel="Deleting…" onClose={() => setPending(null)}
      onConfirm={async () => { const result = await remove({ ...audit, id: pending.row.id }); if ("error" in result) return apiErrorMessage(result.error); setPending(null); return null; }} /> : null}
  </section>;
}
