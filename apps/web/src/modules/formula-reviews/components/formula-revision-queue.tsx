import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { governanceApi, type FormulaQueueItem } from "@/shared/formula/governance-api";
import { decisionProblem, type RevisionStage } from "@/shared/formula/review/revision-review";
import { usePageSearch } from "@/shared/search/page-search";
import { formulaRevisionAudit, revisionDetailPath, stageConfig } from "../lib/formula-revisions";

const column = dataTableColumns<FormulaQueueItem>();
const matches = (item: FormulaQueueItem, search: string) => !search || [item.questionLabel, item.questionReference ?? ""].some((value) => value.toLowerCase().includes(search));

/** The revisions waiting for this stage's decision, newest first, with the ones the user may not decide marked. */
export function FormulaRevisionQueuePage({ stage }: { stage: RevisionStage }) {
  const navigate = useNavigate();
  const config = stageConfig[stage];
  const userId = useCurrentUser()?.id ?? null;
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(stage === "review" ? "formula reviews" : "formula approvals", busy).trim().toLowerCase();
  const options = { refetchOnMountOrArgChange: true } as const;
  const review = governanceApi.useGetFormulaReviewQueueQuery(stage === "review" ? formulaRevisionAudit : skipToken, options);
  const approval = governanceApi.useGetFormulaApprovalQueueQuery(stage === "approval" ? formulaRevisionAudit : skipToken, options);
  const query = stage === "review" ? review : approval;
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const rows = useMemo(() => (query.data ?? []).filter((item) => matches(item, search)), [query.data, search]);
  const columns = useMemo(() => column.columns([
    column.accessor("questionLabel", { header: "Question", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.questionLabel}</div>
      {row.original.questionReference ? <div className="text-xs text-muted-foreground">Ref: {row.original.questionReference}</div> : null}</div> }),
    column.accessor("revision", { header: "Revision", size: 110, cell: ({ row }) => `Revision ${String(row.original.revision)}` }),
    column.accessor((row) => row.createdAt, { id: "created", header: "Revision created", size: 170, cell: ({ row }) => formatDateTime(row.original.createdAt) ?? "–" }),
    ...(stage === "approval" ? [column.accessor((row) => row.reviewedAt ?? "", { id: "reviewed", header: "Reviewed", size: 170, cell: ({ row }) => formatDateTime(row.original.reviewedAt) ?? "–" })] : []),
    column.display({ id: "you", header: "Your part", size: 190, cell: ({ row }) => {
      const problem = decisionProblem(row.original, stage, userId);
      return problem ? <Badge variant="outline" title={problem}>{problem.startsWith("You wrote") ? "You wrote it" : problem.startsWith("You reviewed") ? "You reviewed it" : "Not waiting"}</Badge>
        : <Badge>{stage === "review" ? "Ready for your review" : "Ready for your approval"}</Badge>;
    } }),
  ]), [stage, userId]);
  return <section className="page-fill">
    <div><p className="eyebrow">QUALITY ASSURANCE</p><h1 className="text-xl font-semibold">{config.title}</h1>
      <p className="text-sm text-muted-foreground">{config.description}</p></div>
    <ClientDataTable label={config.title} columns={columns} rows={rows} getRowId={(row) => row.revisionId}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(revisionDetailPath(stage, row.questionId, row.revisionId))}
      error={query.error ? apiErrorMessage(query.error) : null}
      emptyTitle={search ? "No revisions match this search" : config.empty} emptyDescription={search ? "Search by question or reference." : "Revisions appear here when they reach this step."} />
  </section>;
}
