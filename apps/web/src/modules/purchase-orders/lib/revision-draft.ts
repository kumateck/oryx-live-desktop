import type { PurchaseOrder, PurchaseOrderLine } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { formatUnitPrice } from "@/shared/procurement/price";
import { convertUnit, formatQuantityNumber, relatedUnits } from "@/shared/units/quantity";

// The server's numbers for the two kinds of change made here.
const addLine = 2;
const updateLine = 3;
const removeLine = 4;

/** What is being changed on one line. The quantity is typed in `unit`, the largest of the line's family. */
export interface LineDraft { quantity: number | null; unit: string; price: number | null; priceUnit: string; removed: boolean }
export type RevisionDrafts = Readonly<Record<string, LineDraft>>;

/** A line as it stands, in the form it is edited in. */
export function startDraft(line: PurchaseOrderLine): LineDraft {
  const unit = relatedUnits(line.unit).at(-1) ?? line.unit ?? "";
  return { quantity: convertUnit(line.quantity, line.unit, unit) ?? line.quantity, unit, price: line.price, priceUnit: line.priceUnit ?? "", removed: false };
}
export function startDrafts(order: PurchaseOrder): RevisionDrafts {
  return Object.fromEntries(order.items.map((line) => [line.id, startDraft(line)]));
}

/** The draft's quantity in the unit the line is stored in. */
function storedQuantity(line: PurchaseOrderLine, draft: LineDraft): number | null {
  return draft.quantity === null ? null : convertUnit(draft.quantity, draft.unit, line.unit) ?? draft.quantity;
}

/** A material being added to the order. Its quantity is in the unit the supplier supplies it in. */
export interface AddedLine { id: string; materialId: string; materialName: string; unit: string | null; unitId: string; quantity: number; price: number; priceUnit: string }

export type LineChange = { kind: "remove"; line: PurchaseOrderLine } | { kind: "update"; line: PurchaseOrderLine; draft: LineDraft; quantity: number } | { kind: "add"; added: AddedLine };

/** Only the lines that really differ from the order: an untouched line is not a revision. */
export function lineChanges(order: PurchaseOrder, drafts: RevisionDrafts, added: readonly AddedLine[] = []): LineChange[] {
  return [...order.items.flatMap((line): LineChange[] => {
    const draft = drafts[line.id];
    if (!draft) return [];
    if (draft.removed) return [{ kind: "remove", line }];
    const quantity = storedQuantity(line, draft);
    if (quantity === null || draft.price === null) return [{ kind: "update", line, draft, quantity: quantity ?? Number.NaN }];
    const same = quantity === line.quantity && draft.price === line.price && draft.priceUnit.trim() === (line.priceUnit ?? "");
    return same ? [] : [{ kind: "update", line, draft, quantity }];
  }), ...added.map((line): LineChange => ({ kind: "add", added: line }))];
}

export interface RevisionProblem { lineId: string | null; message: string }

export function revisionProblems(order: PurchaseOrder, drafts: RevisionDrafts, added: readonly AddedLine[] = []): RevisionProblem[] {
  const changes = lineChanges(order, drafts, added);
  const problems: RevisionProblem[] = [];
  for (const change of changes) {
    if (change.kind !== "update") continue;

    const name = change.line.materialName;
    if (!Number.isFinite(change.quantity) || change.quantity <= 0) problems.push({ lineId: change.line.id, message: `Enter a quantity above zero for ${name}, or remove the line` });
    else if (change.draft.price === null || change.draft.price <= 0) problems.push({ lineId: change.line.id, message: `Enter a price above zero for ${name}` });
    else if (!change.draft.priceUnit.trim()) problems.push({ lineId: change.line.id, message: `Choose the unit ${name} is priced per` });
    else if (!change.line.unitId) problems.push({ lineId: change.line.id, message: `${name} has no unit record, so it cannot be changed` });
  }
  if (changes.length === 0) problems.push({ lineId: null, message: "Nothing has been changed" });
  // An order with no lines is a cancelled order, which is a different decision.
  else if (added.length === 0 && order.items.every((line) => drafts[line.id]?.removed)) problems.push({ lineId: null, message: "At least one line has to stay on the order" });
  return problems;
}

export function revisionRequest(changes: readonly LineChange[], currencyId: string | null) {
  return changes.map((change) => change.kind === "remove" ? { type: removeLine as 4, purchaseOrderItemId: change.line.id }
    : change.kind === "add" ? { type: addLine as 2, materialId: change.added.materialId, uoMId: change.added.unitId, quantity: change.added.quantity, price: change.added.price, priceUoM: change.added.priceUnit, currencyId }
    : { type: updateLine as 3, purchaseOrderItemId: change.line.id, uoMId: change.line.unitId, quantity: change.quantity, price: change.draft.price, priceUoM: change.draft.priceUnit.trim(), currencyId: change.line.currencyId });
}

/** A change in words, for the confirmation before it is saved. */
export function changeText(change: LineChange, currency: string | null): string {
  if (change.kind === "remove") return `${change.line.materialName}: removed from the order`;
  if (change.kind === "add") return `${change.added.materialName}: added, ${formatQuantityNumber(change.added.quantity, "entered")} ${change.added.unit ?? ""} at ${formatUnitPrice(change.added.price, currency, change.added.priceUnit)}`.replace("  ", " ");
  return `${change.line.materialName}: ${formatQuantityNumber(change.draft.quantity ?? 0, "entered")} ${change.draft.unit} at ${formatUnitPrice(change.draft.price, currency, change.draft.priceUnit)}`;
}
