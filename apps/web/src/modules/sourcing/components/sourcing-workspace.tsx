import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePostApiV1RequisitionSourceMutation } from "@/modules/requisitions/api/requisition-api";
import { RequisitionFacts } from "@/modules/requisitions/components/requisition-facts";
import { RequisitionPrint } from "@/modules/requisitions/components/requisition-print";
import { RequisitionStatusBadge } from "@/modules/requisitions/components/requisition-status-badge";
import type { Requisition, RequisitionLine } from "@/modules/requisitions/schemas/requisition-schema";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { toLargestUnit } from "@/shared/units/quantity";
import { audit, sourcePermission, sourcingListPath } from "../lib/sourcing-access";
import { openLines, reviewSourcing, sourcingBlock, sourcingRequest, type SourcingChoice, type SourcingChoices, type SourcingProblem } from "../lib/sourcing";
import { SourcingLinesTable } from "./sourcing-lines-table";

const doneColumn = dataTableColumns<RequisitionLine>();
const doneColumns = doneColumn.columns([
  doneColumn.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
    <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  doneColumn.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
  doneColumn.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <RequisitionStatusBadge status={row.original.status} type={1} /> }),
]);
const count = (n: number) => `${n} ${n === 1 ? "material" : "materials"}`;

/** One approved purchase requisition: choose, per material, the suppliers who will be asked to quote. */
export function SourcingWorkspace({ requisition }: { requisition: Requisition }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [send, mutation] = usePostApiV1RequisitionSourceMutation();
  const [choices, setChoices] = useState<SourcingChoices>({});
  const [problems, setProblems] = useState<readonly SourcingProblem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const open = useMemo(() => openLines(requisition), [requisition]);
  const closed = useMemo(() => requisition.items.filter((line) => !open.includes(line)), [requisition, open]);
  const block = sourcingBlock(requisition);
  const maySource = has(sourcePermission);
  const review = useMemo(() => reviewSourcing(open, choices), [open, choices]);
  const invalid = useMemo(() => new Set(problems.map((problem) => problem.lineId)), [problems]);
  const change = useCallback((lineId: string, choice: SourcingChoice) => {
    setChoices((current) => ({ ...current, [lineId]: choice }));
    setProblems((current) => current.filter((problem) => problem.lineId !== lineId));
  }, []);

  const start = () => {
    setProblems(review.problems);
    if (review.problems.length === 0 && review.ready.length > 0) setConfirming(true);
  };
  const save = async (): Promise<string | null> => {
    const result = await send({ ...audit, domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest: sourcingRequest(requisition.id, review.ready, choices) });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success("Suppliers saved", { description: "The materials are now on each supplier's quotation request." });
    setSaved(true);
    void navigate(sourcingListPath);
    return null;
  };
  const dirty = Object.values(choices).some((choice) => choice.source !== null);

  return <article className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={dirty && !saved && !mutation.isLoading} />
    <PageHeader title={requisition.code} crumbs={[{ label: "Purchase requisitions", to: sourcingListPath }, { label: requisition.code }]}
      actions={<><PrintButton size="default" preview={(close) => <RequisitionPrint requisition={requisition} onClose={close} />} />
        {block === null && maySource ? <Button type="button" disabled={mutation.isLoading || review.ready.length === 0 && review.problems.length === 0} onClick={start}>Save suppliers</Button> : null}</>} />
    <RequisitionStatusBadge status={requisition.status} type={requisition.type} />
    <RequisitionFacts requisition={requisition} />
    {requisition.comments ? <section className="space-y-1 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Remarks</h2><RichTextView html={requisition.comments} className="text-sm" /></section> : null}
    {block ? <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">{block}</p> : <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Materials to source</h2>
        <span role="status" className="text-sm text-muted-foreground">{review.ready.length} of {open.length} ready</span>
      </div>
      {maySource ? null : <p role="status" className="text-sm text-muted-foreground">You can view this requisition; choosing its suppliers needs its own permission.</p>}
      <SourcingLinesTable lines={open} choices={choices} invalid={invalid} disabled={!maySource || mutation.isLoading} onChange={change} />
      {problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{problems.map((problem) => <li key={problem.lineId}>{problem.message}</li>)}</ul> : null}
    </section>}
    {closed.length > 0 ? <section className="space-y-2"><h2 className="text-sm font-semibold">{block ? "Materials" : "Already handled"}</h2>
      <ClientDataTable label="Materials already handled" columns={doneColumns} rows={closed} getRowId={(row) => row.id} fill={false} /></section> : null}
    {confirming ? <ConfirmActionDialog require={sourcePermission} destructive={false} title={`Save suppliers for ${count(review.ready.length)}?`}
      description={`Each chosen supplier gets these materials on its next quotation request. This cannot be undone here.${review.untouched.length > 0 ? ` ${count(review.untouched.length)} without suppliers ${review.untouched.length === 1 ? "stays" : "stay"} on the requisition for later.` : ""}`}
      confirmLabel="Save suppliers" busyLabel="Saving…" onConfirm={save} onClose={() => setConfirming(false)} /> : null}
  </article>;
}
