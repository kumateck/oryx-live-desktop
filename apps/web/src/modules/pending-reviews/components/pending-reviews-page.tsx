import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { useReadPendingReviewsQuery } from "@/shared/reviews/review-api";
import { reviewStatus, reviewStatusLabels, type PendingReview } from "@/shared/reviews/review-schema";
import { reviewDocumentLabel, reviewDocumentPath } from "../lib/review-documents";

const column = dataTableColumns<PendingReview>();
const columns = column.columns([
  column.accessor((row) => row.code ?? "", { id: "code", header: "Document", cell: ({ row }) => <div className="min-w-0">
    <div className="break-words font-medium">{row.original.code ?? "No number"}</div><div className="text-xs text-muted-foreground">{reviewDocumentLabel(row.original)}</div></div> }),
  column.accessor((row) => row.status, { id: "status", header: "Waiting for", size: 200, cell: ({ row }) => row.original.status === reviewStatus.returned
    ? <Badge variant="destructive">Your correction</Badge> : <Badge variant="secondary">{reviewStatusLabels[row.original.status]}</Badge> }),
  column.accessor((row) => row.preparedBy?.name ?? "", { id: "preparedBy", header: "Prepared by", cell: ({ row }) => row.original.preparedBy?.name ?? "–" }),
  column.accessor((row) => row.submittedAt, { id: "submitted", header: "Sent for review", size: 180, cell: ({ row }) => formatDateTime(row.original.submittedAt) ?? "–" }),
  column.accessor((row) => row.comments ?? "", { id: "comments", header: "Reviewer's comment", cell: ({ row }) => row.original.status === reviewStatus.returned && row.original.comments
    ? <span className="break-words">{row.original.comments}</span> : <span className="text-muted-foreground">–</span> }),
]);

/** Records waiting for the user's review, and records returned to the user to correct. Each opens its own page, which has the Review panel. */
export function PendingReviewsPage() {
  const navigate = useNavigate();
  const query = useReadPendingReviewsQuery({ page: 1, pageSize: 100 }, { refetchOnMountOrArgChange: true });
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const more = (query.data?.totalRecordCount ?? 0) > rows.length;
  return <article className="min-w-0 space-y-4">
    <PageHeader title="My pending reviews" crumbs={[{ label: "My pending reviews" }]} />
    <p className="text-sm text-muted-foreground">Records to check before they go for approval, and records returned to you to correct.</p>
    <ClientDataTable label="Records waiting for review" columns={columns} rows={rows} getRowId={(row) => row.reviewId} loading={query.isLoading}
      refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : null}
      onRowOpen={(row) => { const path = reviewDocumentPath(row); if (path) void navigate(path); }}
      emptyTitle="Nothing is waiting" emptyDescription="No record needs your review or your correction." />
    {more ? <p className="text-sm text-muted-foreground">Showing the oldest {rows.length} of {query.data?.totalRecordCount}. Deal with these to see the rest.</p> : null}
  </article>;
}
