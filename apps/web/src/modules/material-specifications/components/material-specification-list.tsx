import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionDialog, DropdownButton, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { specificationRowsSchema, type Specification } from "@/shared/specifications/specification-schema";
import { compareNumbers } from "@/shared/specifications/specification-rules";
import { useApproveSpecification, VerifiableSpecification } from "@/shared/specifications/use-approve-specification";
import { materialSpecificationsApi, specificationApproved } from "../api/material-specifications-api";
import { audit, completePath, completePermission, createPath, detailPath, editPath, kindName, specPermissions } from "../lib/material-specifications";

const column = dataTableColumns<Specification>();
type Pending = { action: "approve" | "remove"; row: Specification };

/** Raw and packaging material specifications, each kind behind its own permission. */
export function MaterialSpecificationListPage() {
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(specPermissions.view);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("material specifications", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${String(kind)}` });
  const query = materialSpecificationsApi.useGetApiV1MaterialSpecificationsQuery({ ...audit, materialKind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? specificationRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => compareNumbers(a.number, b.number)) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [pending, setPending] = useState<Pending | null>(null);
  const [remove] = materialSpecificationsApi.useDeleteApiV1MaterialSpecificationsByIdMutation();
  const approval = useApproveSpecification(VerifiableSpecification.Material, specificationApproved, audit);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  const columns = useMemo(() => {
    const open: MaterialKind = kind ?? 0;
    return column.columns([
      column.accessor((row) => row.item?.code ?? "", { id: "code", header: "Material code", size: 140, cell: ({ row }) => row.original.item?.code ?? "–" }),
      column.accessor((row) => row.item?.name ?? "", { id: "material", header: "Material", cell: ({ row }) => <span className="break-words font-medium">{row.original.item?.name ?? "–"}</span> }),
      column.accessor("number", { header: "Specification", size: 170 }),
      column.accessor((row) => row.effectiveDate ?? "", { id: "effective", header: "Effective", size: 120, cell: ({ row }) => formatDate(row.original.effectiveDate) ?? "–" }),
      column.accessor((row) => row.reviewDate ?? "", { id: "review", header: "Revision date", size: 130, cell: ({ row }) => formatDate(row.original.reviewDate) ?? "–" }),
      column.accessor((row) => row.revisionNumber ?? "", { id: "revision", header: "Revision", size: 100, cell: ({ row }) => row.original.revisionNumber ?? "–" }),
      column.accessor((row) => row.supersedesNumber ?? "", { id: "supersedes", header: "Supersedes", size: 130, cell: ({ row }) => row.original.supersedesNumber ?? "–" }),
      column.accessor("isVerified", { header: "Approved", size: 120, cell: ({ row }) => row.original.isVerified ? <Badge><BadgeCheck />Approved</Badge> : <Badge variant="outline">Not approved</Badge> }),
      column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.number}`} items={[
        { id: "edit", label: "Edit", icon: Pencil, require: specPermissions.edit[open], to: editPath(row.original.id) },
        { id: "complete", label: "Set test references", icon: ClipboardCheck, require: completePermission(open), to: completePath(row.original.id) },
        !row.original.isVerified && { id: "approve", label: "Approve", icon: BadgeCheck, require: specPermissions.verify[open], onSelect: () => setPending({ action: "approve", row: row.original }) },
        { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: specPermissions.remove[open], onSelect: () => setPending({ action: "remove", row: row.original }) },
      ]} /> }),
    ]);
  }, [kind]);

  const open: MaterialKind = kind ?? 0;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Material specifications</h1></div>
      <div className="flex flex-wrap items-center gap-2"><KindSwitch tabs={tabs} kind={kind} onSelect={select} />
        <DropdownButton label="New specification" icon={Plus} variant="default" items={[
          { id: "raw", label: "Raw material", require: specPermissions.create[0], to: createPath(0) },
          { id: "packaging", label: "Packaging material", require: specPermissions.create[1], to: createPath(1) },
        ]} /></div></div>
    <ServerDataTable label="Material specifications" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned specifications the app could not read." : null}
      emptyTitle={search.trim() ? "No specifications match this search" : `No ${kindName(open)} material specifications`} emptyDescription={search.trim() ? "Search by specification number or material." : "Create a specification to set how a material is tested."} />
    {pending?.action === "approve" ? <ConfirmActionDialog require={specPermissions.verify[open]} destructive={false} title={`Approve ${pending.row.number}?`}
      description="Approving marks the specification as checked. Analysts test against it from then on." confirmLabel="Approve" busyLabel="Approving…" onClose={() => setPending(null)}
      onConfirm={async () => { const error = await approval.approve(pending.row.id); if (!error) setPending(null); return error; }} /> : null}
    {pending?.action === "remove" ? <ConfirmActionDialog require={specPermissions.remove[open]} title={`Delete ${pending.row.number}?`}
      description="The specification is removed for every material linked to it. This cannot be undone." confirmLabel="Delete specification" busyLabel="Deleting…" onClose={() => setPending(null)}
      onConfirm={async () => { const result = await remove({ ...audit, id: pending.row.id }); if ("error" in result) return apiErrorMessage(result.error); setPending(null); return null; }} /> : null}
  </section>;
}
