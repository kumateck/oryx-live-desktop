import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownButton } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useGetIssuedBmrHistoryQuery } from "../api/issued-bmr-api";
import { issuedBmrAudit, issuedBmrPermissions } from "../lib/access";
import { historySchema, type IssuedBmr, type Revision } from "../schemas/issued-bmr";
import { RevisionReviewDialog } from "./review-dialog";

const statuses = ["Pending approval", "Approved", "Rejected"] as const;
const dateText = (value: string | null) => formatMonthYear(value) ?? "Not set";

export function BmrHistoryDialog({ row, onClose }: { row: IssuedBmr; onClose: () => void }) {
  const query = useGetIssuedBmrHistoryQuery({ ...issuedBmrAudit, id: row.id });
  const parsed = useMemo(() => query.data ? historySchema.safeParse(query.data) : null, [query.data]);
  const [reviewing, setReviewing] = useState<{ revision: Revision; approve: boolean } | null>(null);
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned history the app could not read." : null;
  if (reviewing) return <RevisionReviewDialog id={row.id} {...reviewing} onClose={() => setReviewing(null)} onDone={() => setReviewing(null)} />;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-3xl">
    <DialogHeader><DialogTitle>History and revisions · {row.batchNumber}</DialogTitle>
      <DialogDescription>Only approved date revisions affect the batch. Issued certificates keep their original headers and are revised separately.</DialogDescription></DialogHeader>
    <DialogBody className="space-y-6">
      {query.isLoading ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-24" /></div>
        : error ? <p role="alert" className="text-sm text-destructive">{error} <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></p>
        : parsed?.success ? <>
          <section className="space-y-3"><h3 className="font-semibold">Date revisions</h3>
            {parsed.data.revisions.length ? parsed.data.revisions.map(revision => <article key={revision.id} className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant={revision.status === 0 ? "outline" : "secondary"}>{statuses[revision.status]}</Badge>
                {revision.status === 0 && !row.isRetired && !revision.isRequester ? <DropdownButton label={`Review revision for ${revision.batchNumber}`} items={[
                  { id: "approve", label: "Approve revision", require: issuedBmrPermissions.approve, onSelect: () => setReviewing({ revision, approve: true }) },
                  { id: "reject", label: "Reject revision", require: issuedBmrPermissions.approve, onSelect: () => setReviewing({ revision, approve: false }) },
                ]} /> : null}</div>
              <dl className="grid gap-1 sm:grid-cols-2"><div><dt className="text-muted-foreground">Manufacturing</dt><dd>{dateText(revision.previousManufacturingDate)} → {dateText(revision.manufacturingDate)}</dd></div>
                <div><dt className="text-muted-foreground">Expiry</dt><dd>{dateText(revision.previousExpiryDate)} → {dateText(revision.expiryDate)}</dd></div></dl>
              <p className="break-words">{revision.reason}</p><p className="text-xs text-muted-foreground">Requested by {revision.requestedByName || "Recorded user"} · {formatDateTime(revision.requestedAt)}</p>
              {revision.status === 0 && revision.isRequester ? <p className="text-muted-foreground">Someone else with approval permission must review your request.</p> : null}
              {revision.reviewedAt ? <p className="break-words text-xs text-muted-foreground">{revision.reviewedByName} · {formatDateTime(revision.reviewedAt)} · {revision.reviewReason}</p> : null}
            </article>) : <p className="text-sm text-muted-foreground">No date revisions requested.</p>}
          </section>
          <section className="space-y-3"><h3 className="font-semibold">Applied changes</h3>
            {parsed.data.changes.length ? parsed.data.changes.map(change => <article key={change.id} className="space-y-1 rounded-lg border p-3 text-sm">
              <p className="font-medium">{change.revisionId ? "Approved date revision" : "Batch-number typo correction"}</p>
              <p>{change.previousBatchNumber} → {change.batchNumber}</p>
              {change.revisionId ? <p>Manufacturing: {dateText(change.previousManufacturingDate)} → {dateText(change.manufacturingDate)}<br />Expiry: {dateText(change.previousExpiryDate)} → {dateText(change.expiryDate)}</p> : null}
              <p className="break-words">{change.reason}</p><p className="text-xs text-muted-foreground">{change.actorName} · {formatDateTime(change.occurredAt)}</p>
            </article>) : <p className="text-sm text-muted-foreground">No corrections applied.</p>}
          </section>
        </> : null}
    </DialogBody>
    <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}
