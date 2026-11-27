import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useApplyPercentageRecalculationMutation, useReadPercentageRecalculationQuery } from "@/shared/formula/repairs/api";
import { PageHeader } from "@/shared/navigation/page-header";
import {
  percentageItemSchema, percentageOutcomeSchema, percentageRecalculationAudit as audit, percentageRecalculationKey as key,
  reasonProblem, resultsText, type PercentageItem, type PercentageOutcome,
} from "../lib/percentage-recalculation";

const column = dataTableColumns<PercentageItem>();
const columns = column.columns([
  column.accessor((row) => row.product ?? "", { id: "product", header: "Product" }),
  column.accessor((row) => row.batch ?? "", { id: "batch", header: "Batch" }),
  column.accessor((row) => row.arNumber ?? "", { id: "ar", header: "AR number" }),
  column.accessor("test", { header: "Test" }),
  column.accessor("currentResults", { header: "Stored result", cell: ({ row }) => resultsText(row.original.currentResults) }),
  column.accessor((row) => row.blocker ?? "", { id: "state", header: "State", cell: ({ row }) => row.original.blocker
    ? <span className="text-destructive">{row.original.blocker}</span>
    : <Badge variant="outline">{row.original.finalized ? "Final · ready" : "Ready"}</Badge> }),
]);

/**
 * Repaired Percentage results that were stored as fractions (1.03 for 102.85%) before the × 100 fix. Recalculating gives each
 * one a new, audited calculation in percent; the earlier result stays in the test's history and a final result stays final.
 */
export function PercentageRecalculationPage() {
  const query = useReadPercentageRecalculationQuery(audit);
  const parsed = useMemo(() => percentageItemSchema.array().safeParse(query.data), [query.data]);
  const rows = parsed.success ? parsed.data : [];
  const ready = rows.filter((row) => !row.blocker);
  const [confirming, setConfirming] = useState(false);
  const [outcomes, setOutcomes] = useState<PercentageOutcome[] | null>(null);
  return <section className="page-fill space-y-4">
    <PageHeader title="Recalculate Percentage results" crumbs={[]} actions={ready.length
      ? <PermissionGuard require={key}><Button type="button" onClick={() => setConfirming(true)}>Recalculate {ready.length} {ready.length === 1 ? "result" : "results"}</Button></PermissionGuard>
      : undefined} />
    <p className="max-w-3xl text-sm text-muted-foreground">These formula results have Percentage switched on but were stored as a fraction, for example 1.03
      for an assay of 102.85%. Recalculating records a new result in percent from the saved readings. The earlier result stays in the test's history.</p>
    {outcomes ? <Outcomes outcomes={outcomes} rows={rows} onDismiss={() => setOutcomes(null)} /> : null}
    <ClientDataTable label="Percentage results to recalculate" columns={columns} rows={rows} getRowId={(row) => `${row.responseId}:${row.formFieldId}`}
      loading={query.isLoading} refreshing={query.isFetching} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : query.data !== undefined && !parsed.success ? "The results could not be read." : null}
      emptyTitle="No Percentage results need recalculating" />
    {confirming ? <RecalculateDialog items={ready} onClose={() => setConfirming(false)}
      onDone={(done) => { setOutcomes(done); void query.refetch(); }} /> : null}
  </section>;
}

function RecalculateDialog({ items, onClose, onDone }: { items: PercentageItem[]; onClose: () => void; onDone: (outcomes: PercentageOutcome[]) => void }) {
  const [reason, setReason] = useState("");
  const [apply] = useApplyPercentageRecalculationMutation();
  return <ConfirmActionDialog require={key} destructive={false} title={`Recalculate ${items.length} Percentage ${items.length === 1 ? "result" : "results"}?`}
    description="Each result is recalculated in percent from its saved readings. The earlier result is kept in the history and a final result stays final."
    confirmLabel="Recalculate" busyLabel="Recalculating…" onClose={onClose} onConfirm={async () => {
      const problem = reasonProblem(reason);
      if (problem) return problem;
      const result = await apply({ ...audit, reason: reason.trim(), targets: items.map((item) => ({ responseId: item.responseId, formFieldId: item.formFieldId })) });
      if ("error" in result) return apiErrorMessage(result.error);
      const outcomes = percentageOutcomeSchema.array().safeParse(result.data);
      if (!outcomes.success) return "The recalculation finished, but its results could not be read. Reload the page.";
      onDone(outcomes.data);
      return null;
    }}>
    <div className="space-y-1.5"><Label htmlFor="percentage-reason">Reason</Label>
      <Textarea id="percentage-reason" value={reason} maxLength={2000} rows={3} onChange={(event) => setReason(event.target.value)}
        placeholder="Why these results are being recalculated" /></div>
  </ConfirmActionDialog>;
}

function Outcomes({ outcomes, rows, onDismiss }: { outcomes: PercentageOutcome[]; rows: PercentageItem[]; onDismiss: () => void }) {
  const done = outcomes.filter((item) => item.recalculated).length;
  const name = (outcome: PercentageOutcome) => {
    const row = rows.find((item) => item.responseId === outcome.responseId && item.formFieldId === outcome.formFieldId);
    return row ? [row.batch, row.test].filter(Boolean).join(" · ") : "Result";
  };
  return <section aria-label="Recalculation results" className="space-y-2 rounded-lg border bg-card p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">{done} of {outcomes.length} recalculated</h2>
      <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button></div>
    <ul className="space-y-1 text-sm">{outcomes.map((outcome) => <li key={`${outcome.responseId}:${outcome.formFieldId}`} className="break-words">
      <span className="font-medium">{name(outcome)}</span>{": "}
      {outcome.recalculated
        ? <>{resultsText(outcome.previousResults)} → <span className="font-medium">{resultsText(outcome.results)}</span></>
        : <span className="text-destructive">{outcome.problem ?? "Not recalculated."}</span>}
    </li>)}</ul>
  </section>;
}
