import { useMemo, useState, type ReactNode } from "react";
import { FilePlus2, FileUp, GitBranchPlus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { overviewSchema, RevisionStatus, stageLabel, stageVariant, summariesSchema, type RevisionSummary, type StpNumberOverview } from "./stp-content";
import { stpRevisionAudit, stpRevisionKeys, type StpKind, type StpRoutesFor } from "./stp-keys";
import { useStpNumbersQuery, useStpRevisionsQuery } from "./stp-revision-api";
import { DeleteStpRevisionDialog, ReviseStpDialog } from "./stp-revision-dialogs";

const numberColumn = dataTableColumns<StpNumberOverview>();
const revisionColumn = dataTableColumns<RevisionSummary>();
const stage = (row: RevisionSummary | null) => row ? <Badge variant={stageVariant(row.status)}>Rev. {row.revisionNumber} · {stageLabel(row.status, row.reviewStatus)}</Badge> : "–";

interface Props { kind: StpKind; routes: StpRoutesFor; title: string; crumbs: readonly PageCrumb[]; switcher?: ReactNode }

/** The STP numbers of a kind with their current and in-preparation revisions; with `?stp=`, one number's history. */
export function StpRevisionListPage(props: Props) {
  const [params] = useSearchParams();
  const stpNumber = params.get("stp")?.trim() || null;
  return stpNumber ? <StpHistory {...props} stpNumber={stpNumber} /> : <StpNumbers {...props} />;
}

function StpNumbers({ kind, routes, title, crumbs, switcher }: Props) {
  const navigate = useNavigate();
  const query = useStpNumbersQuery({ ...stpRevisionAudit, kind }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? overviewSchema.safeParse(query.data) : null, [query.data]);
  const columns = useMemo(() => numberColumn.columns([
    numberColumn.accessor("stpNumber", { header: "STP number", size: 190, cell: ({ row }) => <span className="font-medium">{row.original.stpNumber}</span> }),
    numberColumn.accessor((r) => r.current?.title ?? r.inPreparation?.title ?? "", { id: "title", header: "Title" }),
    numberColumn.accessor((r) => r.current?.revisionNumber ?? -1, { id: "current", header: "Current", size: 200, cell: ({ row }) => stage(row.original.current) }),
    numberColumn.accessor((r) => r.inPreparation?.revisionNumber ?? -1, { id: "preparing", header: "In preparation", size: 240, cell: ({ row }) => stage(row.original.inPreparation) }),
    numberColumn.accessor("revisionCount", { header: "Revisions", size: 100 }),
  ]), []);
  return <section className="page-fill">
    <PageHeader title={title} crumbs={crumbs} actions={switcher} />
    <p className="text-sm text-muted-foreground">The structured content of each STP. The current revision is the procedure of record; Word documents stay as history and as an import source.</p>
    <ClientDataTable label="STP numbers" columns={columns} rows={parsed?.success ? parsed.data : []} getRowId={(r) => r.stpNumber}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(r) => void navigate(routes(kind).list(r.stpNumber))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned STPs the app could not read." : null}
      emptyTitle="No STP numbers of this kind" emptyDescription="Create the STP first; its revisions are prepared here." />
  </section>;
}

function StpHistory({ kind, routes, title, crumbs, stpNumber }: Props & { stpNumber: string }) {
  const navigate = useNavigate();
  const { has } = useAccess();
  const keys = stpRevisionKeys(kind);
  const [revising, setRevising] = useState<RevisionSummary | null>(null);
  const [deleting, setDeleting] = useState<RevisionSummary | null>(null);
  const query = useStpRevisionsQuery({ ...stpRevisionAudit, kind, stpNumber }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? summariesSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const current = rows.find((row) => row.status === RevisionStatus.Approved) ?? null;
  const preparing = rows.some((row) => row.status === RevisionStatus.Draft || row.status === RevisionStatus.Pending);
  const columns = useMemo(() => revisionColumn.columns([
    revisionColumn.accessor("revisionNumber", { header: "Revision", size: 100, cell: ({ row }) => <span className="font-medium">Rev. {row.original.revisionNumber}</span> }),
    revisionColumn.accessor((r) => r.supersedesRevision ?? -1, { id: "supersedes", header: "Supersedes", size: 110, cell: ({ row }) => row.original.supersedesRevision ?? "–" }),
    revisionColumn.accessor((r) => r.title ?? "", { id: "title", header: "Title" }),
    revisionColumn.accessor("testCount", { header: "Tests", size: 80 }),
    revisionColumn.accessor((r) => r.preparedBy ?? "", { id: "preparedBy", header: "Prepared by" }),
    revisionColumn.accessor((r) => r.createdAt ?? "", { id: "created", header: "Prepared", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    revisionColumn.accessor((r) => r.approvedAt ?? "", { id: "approved", header: "Approved", size: 120, cell: ({ row }) => formatDate(row.original.approvedAt) ?? "–" }),
    revisionColumn.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <Badge variant={stageVariant(row.original.status)}>{stageLabel(row.original.status, row.original.reviewStatus)}</Badge> }),
    revisionColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for revision ${String(row.original.revisionNumber)}`} items={[
      ...(row.original.status === RevisionStatus.Approved && !preparing ? [{ id: "revise", label: "New revision", icon: GitBranchPlus, require: keys.revise, onSelect: () => setRevising(row.original) }] : []),
      { id: "delete", label: "Delete revision", icon: Trash2, destructive: true, separated: true, require: keys.delete, onSelect: () => setDeleting(row.original) },
    ]} /> }),
  ]), [keys, preparing]);
  return <section className="page-fill">
    <PageHeader title={stpNumber} crumbs={[...crumbs.slice(0, -1), { label: title, to: routes(kind).list() }, { label: stpNumber }]} actions={<>
      {!preparing && has(keys.import) ? <Button size="sm" variant="outline" onClick={() => void navigate(routes(kind).import(stpNumber))}><FileUp />Import Word STP</Button> : null}
      {!preparing && !current && has(keys.create) && parsed?.success ? <Button size="sm" onClick={() => void navigate(routes(kind).create(stpNumber))}><FilePlus2 />Start blank</Button> : null}
      {!preparing && current && has(keys.revise) ? <Button size="sm" onClick={() => setRevising(current)}><GitBranchPlus />New revision</Button> : null}
    </>} />
    {preparing ? <p className="text-sm text-muted-foreground">A revision is in preparation. Continue, submit or delete it before starting another.</p> : null}
    <ClientDataTable label={`Revisions of ${stpNumber}`} columns={columns} rows={rows} getRowId={(r) => r.id}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(r) => void navigate(routes(kind).detail(r.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned revisions the app could not read." : null}
      emptyTitle="No structured revision yet" emptyDescription="Import the Word STP or start a blank revision." />
    {revising ? <ReviseStpDialog current={revising} routes={routes(kind)} onClose={() => setRevising(null)} /> : null}
    {deleting ? <DeleteStpRevisionDialog revision={deleting} onClose={() => setDeleting(null)} /> : null}
  </section>;
}
