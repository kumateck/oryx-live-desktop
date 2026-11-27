import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { StpContentView } from "./stp-content-view";
import { detailSchema } from "./stp-content";
import { stpKindLabel, stpRevisionAudit } from "./stp-keys";
import { useStpRevisionQuery } from "./stp-revision-api";

/** The revision an approver is deciding: its header, who checked it, and its full content. */
export function StpRevisionApprovalEvidence({ id }: { id: string }) {
  const query = useStpRevisionQuery({ ...stpRevisionAudit, id });
  const parsed = useMemo(() => query.data ? detailSchema.safeParse(query.data) : null, [query.data]);
  if (query.isLoading) return <Skeleton className="h-40 w-full" />;
  if (query.error || !parsed?.success) return <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The revision could not be read."}</p>;
  const revision = parsed.data;
  return <section aria-label="STP revision" className="space-y-3">
    <dl className="grid gap-3 text-sm sm:grid-cols-4">
      <div><dt className="text-xs text-muted-foreground">STP No.</dt><dd>{revision.stpNumber} ({stpKindLabel[revision.kind]})</dd></div>
      <div><dt className="text-xs text-muted-foreground">Revision No.</dt><dd>{revision.revisionNumber}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Supersedes</dt><dd>{revision.supersedesRevision ?? "–"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Checked by</dt><dd>{revision.checkedBy?.name ?? "–"}</dd></div>
    </dl>
    <p className="font-medium">{revision.title}</p>
    {revision.reasonForChange ? <p className="text-sm"><span className="text-muted-foreground">Reason for change: </span>{revision.reasonForChange}</p> : null}
    <StpContentView revision={revision} />
  </section>;
}
