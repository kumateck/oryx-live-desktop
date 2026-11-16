import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { useDeleteReviewSettingsMutation, useReadReviewSettingsQuery, useReadReviewTypesQuery } from "@/shared/reviews/review-api";
import type { ReviewConfiguration, ReviewDocumentType } from "@/shared/reviews/review-schema";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { editReviewSettings, ReviewersDialog } from "./reviewers-dialog";

const deleteReviewSettings = "CanDeleteDocumentReviewSettings";

function names(configuration: ReviewConfiguration | undefined): string[] {
  return (configuration?.assignees ?? []).map((item) => item.role ? `${item.role.name ?? "Unnamed role"} (role)` : item.user?.name ?? "Unnamed person");
}

/** What happens to this type's records: who reviews them, or that they go straight to approval. */
function describe(type: ReviewDocumentType, configuration: ReviewConfiguration | undefined): string {
  if (configuration) return "Checked before approval by any of:";
  return type.alwaysReviewed ? "Always checked before approval. With no reviewers named, anyone holding its check key may check it."
    : "No review step: new records go straight to approval.";
}

/** Who reviews each document type before its approvals start. */
export function ReviewSettingsPage() {
  const { has } = useAccess();
  const types = useReadReviewTypesQuery();
  const settings = useReadReviewSettingsQuery();
  const [editing, setEditing] = useState<ReviewDocumentType | null>(null);
  const [removing, setRemoving] = useState<ReviewDocumentType | null>(null);
  const [remove] = useDeleteReviewSettingsMutation();
  const byType = useMemo(() => new Map((settings.data ?? []).map((item) => [item.itemType, item])), [settings.data]);
  const error = types.error ?? settings.error;
  return <article className="min-w-0 space-y-4">
    <PageHeader title="Document reviews" crumbs={[{ label: "Settings" }, { label: "Document reviews" }]} />
    <p className="max-w-3xl text-sm text-muted-foreground">A reviewer checks a record after it is prepared and before it goes for approval, and can return it for correction.
      Their name and signature print as "Checked by". Whoever prepared a record may also confirm its review.</p>
    {types.isLoading || settings.isLoading ? <Skeleton className="h-40 w-full" /> : error ? <div role="alert" className="space-y-2"><p className="text-sm">{apiErrorMessage(error)}</p>
      <Button variant="outline" onClick={() => { void types.refetch(); void settings.refetch(); }}>Retry</Button></div>
      : <ul aria-label="Document types" className="space-y-3">{(types.data ?? []).map((type) => { const configuration = byType.get(type.itemType); const people = names(configuration);
        return <li key={type.itemType} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-card p-4">
          <div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{type.label}</h2>
            {configuration || type.alwaysReviewed ? <Badge>Reviewed</Badge> : <Badge variant="outline">No review</Badge>}</div>
            <p className="text-sm text-muted-foreground">{describe(type, configuration)}</p>
            {people.length ? <p className="break-words text-sm">{people.join(", ")}</p> : null}</div>
          <div className="flex shrink-0 gap-2">
            {has(editReviewSettings) ? <Button size="sm" variant="outline" onClick={() => setEditing(type)}>{configuration ? "Change reviewers" : "Set reviewers"}</Button> : null}
            {configuration && has(deleteReviewSettings) ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRemoving(type)}>Remove</Button> : null}
          </div></li>; })}</ul>}
    {editing ? <ReviewersDialog type={editing} configuration={byType.get(editing.itemType)} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog title={`Remove the reviewers of ${removing.label.toLowerCase()}s?`} require={deleteReviewSettings} confirmLabel="Remove" busyLabel="Removing…"
      description={removing.alwaysReviewed ? "Purchase orders are still checked before approval, by anyone holding the check key."
        : `New ${removing.label.toLowerCase()}s will go straight to approval. Records already waiting for review stay in review until someone with the review key confirms them.`}
      onClose={() => setRemoving(null)} onConfirm={async () => {
        const result = await remove({ itemType: removing.itemType });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Reviewers removed", { description: removing.label });
        return null;
      }} /> : null}
  </article>;
}
