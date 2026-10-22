import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { storeWorkflowLink, workflowKey, workflowRule } from "@/shared/inventory/workflows";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import {
  editable, issueBlocker, issueStockAudit, issueStockRoot, sameIssueEvidence, statusLabel, stockRequisitionAudit, stockRequisitionRoot, stockRequisitionSchema, storeLabel,
  type RequisitionLine, type StockRequisition,
} from "../lib/stock-requisitions";
import { RequisitionEditor } from "./requisition-editor";
import { statusVariant } from "./requisitions-list";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm">{children}</dd></div>;
}
const amount = (n: number, line: RequisitionLine) => `${String(n)} ${line.unit ?? ""}`.trim();

function IssueForm({ requisition, onIssued }: { requisition: StockRequisition; onIssued: () => void }) {
  const [reread] = inventoryApi.useLazyGetApiV1ItemsStockRequisitionsByIdQuery();
  const [issue] = inventoryApi.usePostApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisitionMutation();
  const open = requisition.lines.filter((line) => line.remaining > 0);
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(open.map((line) => [line.id, String(Math.max(0, Math.min(line.remaining, line.available)))])));
  const [confirming, setConfirming] = useState(false);
  const problems = useMemo(() => {
    const found = new Map<string, string>();
    for (const line of open) {
      const raw = quantities[line.id] ?? "";
      const n = Number(raw);
      if (!raw.trim() || n === 0) continue;
      if (!Number.isInteger(n) || n < 0) found.set(line.id, "Enter a whole number.");
      else if (n > line.remaining) found.set(line.id, `Only ${amount(line.remaining, line)} remain to be issued.`);
      else if (n > line.available) found.set(line.id, `Only ${amount(line.available, line)} are in stock.`);
    }
    return found;
  }, [open, quantities]);
  const chosen = open.flatMap((line) => { const n = Number(quantities[line.id] ?? ""); return n > 0 && !problems.has(line.id) ? [{ line, quantity: n }] : []; });
  const store = requisition.store;
  if (store === null) return null;
  return <section aria-label="Issue stock" className="space-y-3 rounded-lg border bg-card p-4">
    <h2 className="font-semibold">Issue stock</h2>
    <p className="text-sm text-muted-foreground">Enter what is being handed over now. Anything left can be issued later.</p>
    <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
      {["Item", "Remaining", "In stock", "Issue now"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
      <tbody>{open.map((line) => <tr key={line.id} className="border-b align-top last:border-0">
        <td className="p-2"><div className="font-medium">{line.name}</div><div className="font-mono text-xs text-muted-foreground">{line.code}</div></td>
        <td className="p-2">{amount(line.remaining, line)}</td><td className="p-2">{amount(line.available, line)}</td>
        <td className="p-2"><Input aria-label={`Issue now: ${line.name}`} inputMode="numeric" className="w-28" value={quantities[line.id] ?? ""}
          aria-invalid={problems.has(line.id) ? true : undefined} onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: event.target.value }))} />
          {problems.get(line.id) ? <p role="alert" className="mt-1 text-xs text-destructive">{problems.get(line.id)}</p> : null}</td>
      </tr>)}</tbody></table></div>
    <Button type="button" disabled={chosen.length === 0 || problems.size > 0} onClick={() => setConfirming(true)}>Issue stock</Button>
    {confirming ? <ConfirmActionDialog require={workflowRule(store, "issueStock", "create")} destructive={false} title={`Issue stock against ${requisition.number}?`}
      description={`${chosen.map(({ line, quantity }) => `${line.name}: ${amount(quantity, line)}`).join("; ")}. The stock leaves the store and is recorded on the item ledger. This cannot be undone here.`}
      confirmLabel="Issue stock" busyLabel="Issuing…" onClose={() => setConfirming(false)}
      onConfirm={async () => {
        const fresh = await reread({ ...issueStockAudit, id: requisition.id }, false);
        if (fresh.error) return apiErrorMessage(fresh.error);
        const current = stockRequisitionSchema.safeParse(fresh.data);
        if (!current.success || !sameIssueEvidence(requisition, current.data)) return "Stock has been issued against this requisition since you opened it. Close this and check the quantities again.";
        const result = await issue({ ...issueStockAudit, stockRequisitionId: requisition.id,
          domainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest: { quantitiesToIssue: chosen.map(({ line, quantity }) => ({ itemId: line.itemId, quantity })) } });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Stock issued");
        onIssued();
        return null;
      }} /> : null}
  </section>;
}

/** One stock requisition: what was asked for, what has been issued and what remains, with the actions this view allows. */
export function StockRequisitionDetailPage({ mode }: { mode: "raise" | "issue" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { can, has } = useAccess();
  const audit = mode === "issue" ? issueStockAudit : stockRequisitionAudit;
  const query = inventoryApi.useGetApiV1ItemsStockRequisitionsByIdQuery({ ...audit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const [remove] = inventoryApi.useDeleteApiV1ItemsStockRequisitionsByIdMutation();
  const parsed = useMemo(() => query.data ? stockRequisitionSchema.safeParse(query.data) : null, [query.data]);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const root = mode === "issue" ? issueStockRoot : stockRequisitionRoot;
  const crumbs = [{ label: mode === "issue" ? "Issue stock" : "Stock requisitions", to: root }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading stock requisition" />;
  if (query.error || !parsed?.success) return <article className="min-w-0 space-y-4"><PageHeader title="Stock requisition" crumbs={crumbs} />
    <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h2 className="text-lg font-semibold">Requisition unavailable</h2>
      <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a requisition the app could not read."}</p>
      <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button size="sm" asChild><Link to={root}>Back to the list</Link></Button></div></div></article>;
  const requisition = parsed.data;
  const store = requisition.store;
  const canEdit = mode === "raise" && store !== null && editable(requisition) && can(workflowRule(store, "stockRequisitions", "create"));
  const canIssue = mode === "issue" && store !== null && can(workflowRule(store, "issueStock", "create"));
  const blocker = issueBlocker(requisition);
  const otherView = store === null ? null : mode === "raise"
    ? (has(workflowKey(store, "issueStock", "view") ?? "") ? { to: storeWorkflowLink(issueStockRoot, store, `/${requisition.id}`), label: "Open in Issue stock" } : null)
    : (has(workflowKey(store, "stockRequisitions", "view") ?? "") ? { to: storeWorkflowLink(stockRequisitionRoot, store, `/${requisition.id}/details`), label: "Open as requisition" } : null);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={requisition.number} crumbs={[...crumbs, { label: requisition.number }]} actions={canEdit || otherView ? <>
      {otherView ? <Button size="sm" variant="outline" asChild><Link to={otherView.to}>{otherView.label}</Link></Button> : null}
      {canEdit ? <><Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button>
        <Button size="sm" variant="outline" onClick={() => setRemoving(true)}><Trash2 />Delete</Button></> : null}</> : undefined} />
    <section aria-label="Requisition" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{storeLabel(store)}</span>
        <Badge variant={statusVariant(requisition.status)}>{statusLabel(requisition.status)}</Badge></div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Raised">{formatDate(requisition.createdAt) ?? "–"}</Fact><Fact label="Requested by">{requisition.requestedBy?.name ?? "–"}</Fact>
        <Fact label="Department">{requisition.department?.name ?? "–"}</Fact><Fact label="Items">{requisition.lines.length}</Fact>
      </dl>
      <div><p className="text-xs text-muted-foreground">Justification</p><p className="whitespace-pre-wrap text-sm">{requisition.justification ?? "–"}</p></div>
    </section>
    <section aria-label="Requisition items" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Items</h2>
      <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
        {["Item", "Code", "Requested", "Issued", "Remaining", "In stock"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
        <tbody>{requisition.lines.map((line) => <tr key={line.id} className="border-b last:border-0">
          <td className="p-2 font-medium">{line.name}{line.active ? null : <Badge variant="secondary" className="ml-2">Inactive</Badge>}</td>
          <td className="p-2 font-mono text-xs">{line.code}</td><td className="p-2">{amount(line.requested, line)}</td><td className="p-2">{amount(line.issued, line)}</td>
          <td className="p-2">{amount(line.remaining, line)}</td><td className="p-2">{amount(line.available, line)}</td></tr>)}</tbody></table></div>
    </section>
    {mode === "issue" ? blocker ? <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{blocker}</p>
      : canIssue ? <IssueForm key={`${requisition.status}|${requisition.lines.map((l) => l.issued).join(",")}`} requisition={requisition} onIssued={() => void query.refetch()} />
      : <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">You can view this requisition but not issue stock from this store.</p> : null}
    {editing && store !== null ? <RequisitionEditor store={store} requisition={requisition} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); void query.refetch(); }} /> : null}
    {removing && store !== null ? <ConfirmActionDialog require={workflowRule(store, "stockRequisitions", "create")} title={`Delete ${requisition.number}?`}
      description="The requisition is withdrawn. Nothing has been issued against it." confirmLabel="Delete requisition" busyLabel="Deleting…" onClose={() => setRemoving(false)}
      onConfirm={async () => { const result = await remove({ ...stockRequisitionAudit, id: requisition.id }); if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Stock requisition deleted"); void navigate(storeWorkflowLink(stockRequisitionRoot, store)); return null; }} /> : null}
  </article>;
}
