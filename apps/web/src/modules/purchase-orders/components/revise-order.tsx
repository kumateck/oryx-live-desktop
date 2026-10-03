import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Plus, Repeat, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PurchaseOrder, PurchaseOrderLine } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { ConfirmActionDialog, TableMenu } from "@/shared/actions";
import { EditableNumberCell, EditableSelectCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { formatMoney, lineCost } from "@/shared/procurement/price";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { convertUnit, relatedUnits } from "@/shared/units/quantity";
import { usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation } from "../api/order-api";
import { audit, orderListPath, orderPath, reviseOrderPermissions } from "../lib/purchase-order-access";
import { changeText, lineChanges, revisionProblems, revisionRequest, startDraft, startDrafts, type AddedLine, type LineDraft, type RevisionDrafts } from "../lib/revision-draft";
import { AddLineDialog } from "./add-line-dialog";
import { ReassignLineDialog } from "./reassign-line-dialog";
import { ReturnLineDialog } from "./return-line-dialog";

type Move = { kind: "reassign" | "return"; line: PurchaseOrderLine };
interface Editing { drafts: RevisionDrafts; invalid: ReadonlySet<string>; currency: string | null; disabled: boolean; unsaved: boolean; onChange: (lineId: string, change: Partial<LineDraft>) => void; onMove: (move: Move) => void }
// The cells read what is being edited from here, so the columns never change and a field keeps focus while another line changes.
const EditingContext = createContext<Editing | null>(null);
function useLine(line: PurchaseOrderLine) {
  const editing = useContext(EditingContext);
  if (!editing) throw new Error("Revision cells must be rendered inside ReviseOrder");
  return { ...editing, draft: editing.drafts[line.id] ?? startDraft(line) };
}

function QuantityCell({ line }: { line: PurchaseOrderLine }) {
  const { draft, invalid, disabled, onChange } = useLine(line);
  return draft.removed ? <span className="text-muted-foreground line-through">{draft.quantity} {draft.unit}</span> : <div className="flex items-center gap-2">
    <EditableNumberCell label={`Quantity of ${line.materialName}`} value={draft.quantity} min={0} disabled={disabled} invalid={invalid.has(line.id)} onCommit={(quantity) => onChange(line.id, { quantity })} />
    <span className="shrink-0 text-sm text-muted-foreground">{draft.unit}</span></div>;
}
function PriceCell({ line }: { line: PurchaseOrderLine }) {
  const { draft, invalid, currency, disabled, onChange } = useLine(line);
  return draft.removed ? <span className="text-muted-foreground">–</span> : <EditableNumberCell label={`Unit price of ${line.materialName}`} value={draft.price} min={0} disabled={disabled} invalid={invalid.has(line.id)}
    {...(currency ? { prefix: currency } : {})} onCommit={(price) => onChange(line.id, { price })} />;
}
function PriceUnitCell({ line }: { line: PurchaseOrderLine }) {
  const { draft, invalid, disabled, onChange } = useLine(line);
  const units = relatedUnits(line.unit);
  if (draft.removed) return <span className="text-muted-foreground">–</span>;
  return units.length > 1 ? <EditableSelectCell label={`Unit ${line.materialName} is priced per`} value={draft.priceUnit || null} options={units.map((unit) => ({ value: unit, label: unit }))} disabled={disabled}
    invalid={invalid.has(line.id) && !draft.priceUnit} placeholder="Unit" onCommit={(priceUnit) => onChange(line.id, { priceUnit })} /> : <span>{draft.priceUnit || "–"}</span>;
}
function AmountCell({ line }: { line: PurchaseOrderLine }) {
  const { draft, currency } = useLine(line);
  if (draft.removed) return <span className="text-destructive">Removed</span>;
  const quantity = draft.quantity === null ? null : convertUnit(draft.quantity, draft.unit, line.unit);
  return <span>{formatMoney(quantity === null ? null : lineCost({ quantity, unit: line.unit, price: draft.price, priceUnit: draft.priceUnit }), currency)}</span>;
}
function RemoveCell({ line }: { line: PurchaseOrderLine }) {
  const { draft, disabled, unsaved, onChange, onMove } = useLine(line);
  if (draft.removed) return <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(line.id, { removed: false })}><RotateCcw />Keep</Button>;
  // Moving a line is saved at once, on its own, so it is only offered when nothing else is waiting to be saved.
  const wait = unsaved ? { disabled: true, disabledReason: "Save or discard your other changes first" } : {};
  return <div className="flex items-center justify-end gap-1">
    <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${line.materialName}`} disabled={disabled} onClick={() => onChange(line.id, { removed: true })}><Trash2 /></Button>
    <TableMenu label={`More actions for ${line.materialName}`} disabled={disabled} items={[
      { id: "reassign", label: "Move to another supplier", icon: Repeat, onSelect: () => onMove({ kind: "reassign", line }),
        ...(unsaved ? wait : line.canReassign ? {} : { disabled: true, disabledReason: "No other supplier quoted for this quantity" }) },
      { id: "return", label: "Return to sourcing", icon: Undo2, onSelect: () => onMove({ kind: "return", line }), ...wait }]} />
  </div>;
}

const column = dataTableColumns<PurchaseOrderLine>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
    <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.display({ id: "quantity", header: "Quantity", size: 210, cell: ({ row }) => <QuantityCell line={row.original} /> }),
  column.display({ id: "price", header: "Unit price", size: 170, cell: ({ row }) => <PriceCell line={row.original} /> }),
  column.display({ id: "priceUnit", header: "Priced per", size: 130, cell: ({ row }) => <PriceUnitCell line={row.original} /> }),
  column.display({ id: "amount", header: "Amount", size: 160, cell: ({ row }) => <AmountCell line={row.original} /> }),
  column.display({ id: "remove", size: 110, header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <RemoveCell line={row.original} /> }),
]);

/** Changes the quantities and prices of an order already sent to its supplier, or takes lines off it. The order then has to be checked and approved again. */
export function ReviseOrder({ order, type }: { order: PurchaseOrder; type: SupplierType }) {
  const navigate = useNavigate();
  const [save, mutation] = usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation();
  const [drafts, setDrafts] = useState<RevisionDrafts>(() => startDrafts(order));
  const [problems, setProblems] = useState<readonly { lineId: string | null; message: string }[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState<readonly AddedLine[]>([]);
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState<Move | null>(null);
  const currency = order.supplier.currency;
  const changes = useMemo(() => lineChanges(order, drafts, added), [order, drafts, added]);
  const onOrder = useMemo(() => new Set([...order.items.flatMap((line) => line.materialId ? [line.materialId] : []), ...added.map((line) => line.materialId)]), [order.items, added]);
  const invalid = useMemo(() => new Set(problems.flatMap((problem) => problem.lineId ? [problem.lineId] : [])), [problems]);
  const change = useCallback((lineId: string, update: Partial<LineDraft>) => {
    setDrafts((current) => { const draft = current[lineId]; return draft ? { ...current, [lineId]: { ...draft, ...update } } : current; });
    setProblems((current) => current.filter((problem) => problem.lineId !== lineId && problem.lineId !== null));
  }, []);
  const editing = useMemo(() => ({ drafts, invalid, currency, disabled: mutation.isLoading, unsaved: changes.length > 0, onChange: change, onMove: setMoving }), [drafts, invalid, currency, mutation.isLoading, changes.length, change]);
  const back = orderPath(order.id, type);

  const review = () => {
    const found = revisionProblems(order, drafts, added);
    setProblems(found);
    if (found.length === 0) setConfirming(true);
  };
  const apply = async (): Promise<string | null> => {
    const result = await save({ ...audit, purchaseOrderId: order.id, body: revisionRequest(changes, order.supplier.currencyId) });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success("Order revised", { description: "It has to be checked and approved again before it is sent." });
    setSaved(true);
    void navigate(back);
    return null;
  };

  return <article className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={changes.length > 0 && !saved && !mutation.isLoading} />
    <PageHeader title={`Revise ${order.code}`} crumbs={[{ label: "Order list", to: `${orderListPath}?type=${type}` }, { label: order.code, to: back }, { label: "Revise" }]}
      actions={<><Button type="button" variant="outline" disabled={mutation.isLoading} onClick={() => void navigate(back)}>Cancel</Button>
        <Button type="button" variant="outline" disabled={mutation.isLoading || !order.supplier.id} onClick={() => setAdding(true)}><Plus />Add line</Button>
        <Button type="button" disabled={mutation.isLoading} onClick={review}>Review changes{changes.length ? ` (${changes.length})` : ""}</Button></>} />
    <p className="text-sm text-muted-foreground">Change a line's quantity or price, add a line, or take one off. Saving creates a new revision; the order then goes back to be checked and approved. Moving a line to another supplier or back to sourcing is done at once, from the line's menu.</p>
    <SupplierSummary supplier={order.supplier} />
    <EditingContext.Provider value={editing}><ListDataTable label="Order lines" columns={columns} rows={order.items} getRowId={(row) => row.id} /></EditingContext.Provider>
    {added.length > 0 ? <section className="space-y-2"><h2 className="text-sm font-semibold">Lines to add ({added.length})</h2>
      <ul className="space-y-1">{added.map((line) => <li key={line.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
        <span className="min-w-0 break-words">{changeText({ kind: "add", added: line }, currency)}</span>
        <Button type="button" size="icon-sm" variant="ghost" aria-label={`Do not add ${line.materialName}`} disabled={mutation.isLoading} onClick={() => setAdded((current) => current.filter((item) => item.id !== line.id))}><Trash2 /></Button></li>)}</ul></section> : null}
    {problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{problems.map((problem) => <li key={`${problem.lineId}:${problem.message}`}>{problem.message}</li>)}</ul> : null}
    {confirming ? <ConfirmActionDialog require={reviseOrderPermissions[type]} destructive={false} title={`Save revision ${order.revisionNumber + 1} of ${order.code}?`}
      description={`${changes.map((item) => changeText(item, currency)).join("; ")}. The supplier is not told until the revised order is approved and sent again.`}
      confirmLabel="Save revision" busyLabel="Saving…" onConfirm={apply} onClose={() => setConfirming(false)} /> : null}
    {adding && order.supplier.id ? <AddLineDialog supplierId={order.supplier.id} currency={currency} onOrder={onOrder} onAdd={(line) => setAdded((current) => [...current, line])} onClose={() => setAdding(false)} /> : null}
    {moving?.kind === "reassign" ? <ReassignLineDialog key={moving.line.id} order={order} line={moving.line} type={type} onClose={() => setMoving(null)} /> : null}
    {moving?.kind === "return" ? <ReturnLineDialog key={moving.line.id} order={order} line={moving.line} onClose={() => setMoving(null)} /> : null}
  </article>;
}
