import { useMemo } from "react";
import { FilePlus2, GitBranchPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { useVendorListsQuery } from "../api/avl-api";
import { ListStatus, stageLabel, summariesSchema, type ListSummary } from "../lib/avl";
import { avlAudit, avlKeys, avlRoot } from "../lib/keys";

const column = dataTableColumns<ListSummary>();
export const stageVariant = (row: Pick<ListSummary, "status">) => row.status === ListStatus.Approved ? "default" as const
  : row.status === ListStatus.Rejected ? "destructive" as const : row.status === ListStatus.Superseded ? "outline" as const : "secondary" as const;

/** Every revision of the approved vendor list, newest first, with the actions that start the next one. */
export function VendorListsPage() {
  const navigate = useNavigate();
  const { has } = useAccess();
  const query = useVendorListsQuery({ ...avlAudit }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? summariesSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const current = rows.find((row) => row.status === ListStatus.Approved) ?? null;
  const pending = rows.some((row) => row.status === ListStatus.Pending);
  const columns = useMemo(() => column.columns([
    column.accessor("revisionNumber", { header: "Revision", size: 100, cell: ({ row }) => <span className="font-medium">Rev. {row.original.revisionNumber}</span> }),
    column.accessor((r) => r.supersedesRevision ?? -1, { id: "supersedes", header: "Supersedes", size: 110, cell: ({ row }) => row.original.supersedesRevision ?? "–" }),
    column.accessor((r) => r.annexureNumber ?? "", { id: "annexure", header: "Annexure No.", cell: ({ row }) => row.original.annexureNumber ?? "–" }),
    column.accessor("lineCount", { header: "Lines", size: 80 }),
    column.accessor((r) => r.preparedBy ?? "", { id: "preparedBy", header: "Prepared by", cell: ({ row }) => row.original.preparedBy ?? "–" }),
    column.accessor((r) => r.createdAt ?? "", { id: "created", header: "Prepared", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((r) => r.approvedAt ?? "", { id: "approved", header: "Approved", size: 120, cell: ({ row }) => formatDate(row.original.approvedAt) ?? "–" }),
    column.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <Badge variant={stageVariant(row.original)}>{stageLabel(row.original.status, row.original.reviewStatus)}</Badge> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">QUALITY ASSURANCE</p>
      <h1 className="text-xl font-semibold">Approved vendor list</h1>
      <p className="text-sm text-muted-foreground">Manufacturers and suppliers approved for each raw material. Procurement may only use the current revision's lines that are still valid.</p></div>
      <div className="flex flex-wrap gap-2">
        {current && !pending && has(avlKeys.revise) ? <Button size="sm" onClick={() => void navigate(`${avlRoot}/revise`)}><GitBranchPlus />New revision</Button> : null}
        {!current && !pending && has(avlKeys.create) && parsed?.success ? <Button size="sm" onClick={() => void navigate(`${avlRoot}/new`)}><FilePlus2 />Prepare list</Button> : null}
      </div></header>
    {pending ? <p className="text-sm text-muted-foreground">A revision is being prepared. A new one can start once it is approved or rejected.</p> : null}
    <ClientDataTable label="Approved vendor list revisions" columns={columns} rows={rows} getRowId={(r) => r.id}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(r) => void navigate(`${avlRoot}/${r.id}/details`)}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned lists the app could not read." : null}
      emptyTitle="No approved vendor list yet" emptyDescription="Prepare the first list from the current paper revision." />
  </section>;
}
