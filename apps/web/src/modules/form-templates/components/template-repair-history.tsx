import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useGetTemplateRepairHistoryQuery } from "../api/template-repair-api";
import { templateRepairAudit, templateRepairHistorySchema } from "../lib/template-repair-schema";

export function TemplateRepairHistory({ formId }: { formId: string }) {
  const query = useGetTemplateRepairHistoryQuery({ ...templateRepairAudit, formId });
  const parsed = templateRepairHistorySchema.safeParse(query.currentData);
  return <section aria-label="Repair history" className="space-y-3">
    <h2 className="font-semibold">Repair history</h2>
    {query.isLoading ? <Skeleton className="h-16 w-full" /> : query.error || !parsed.success ? <div role="alert" className="space-y-2 text-sm">
      <p>{query.error ? apiErrorMessage(query.error) : "Repair history could not be read."}</p>
      <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry history</Button>
    </div> : parsed.data.length === 0 ? <p className="text-sm text-muted-foreground">No template repairs recorded.</p> : <ul className="space-y-4">
      {parsed.data.map(row => <li key={row.id} className="space-y-1 text-sm">
        <p className="font-medium">{row.fields} fields across {row.tests} tests · {row.actorName} · {formatDate(row.appliedAt)}</p>
        <p className="break-words">{row.reason}</p>
        <p className="break-all text-muted-foreground">Receipt: {row.id}</p>
      </li>)}
    </ul>}
  </section>;
}
