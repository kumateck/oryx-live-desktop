import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { permissionDeniedMessage, usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useCorrectPurchaseRequisitionMutation } from "../api/requisition-api";
import { orderLineProblems, toRequisitionItems, type OrderLine } from "../lib/order-lines";
import { correctionPermissions, requisitionKinds } from "../lib/requisition-review";
import { requisitionType } from "../lib/requisition-status";
import type { Requisition } from "../schemas/requisition-schema";
import { OrderLinesTable } from "./order-lines-table";

/** The requisition's lines as editable lines, each quantity in the unit it is stored in. */
function linesOf(requisition: Requisition): OrderLine[] {
  return requisition.items.flatMap((line) => line.materialId ? [{ id: line.materialId, name: line.materialName, code: line.materialCode, unit: line.unit, unitId: line.unitId,
    stock: 0, maximum: 0, quantity: line.quantity, enteredUnit: line.unit ?? "" }] : []);
}

/**
 * Corrects the quantities of a purchase requisition in review, or removes lines from it. Its reviewer or its preparer may
 * do this before it goes for approval; the correction is recorded on its review.
 */
export function CorrectRequisitionDialog({ requisition, onClose }: { requisition: Requisition; onClose: () => void }) {
  const [lines, setLines] = useState<OrderLine[]>(() => linesOf(requisition));
  const [problems, setProblems] = useState<readonly { id: string; message: string }[]>([]);
  const [message, setMessage] = useState("");
  const [correct, mutation] = useCorrectPurchaseRequisitionMutation();
  const permission = usePermissionAction(correctionPermissions(requisitionKinds(requisition)));
  const change = useCallback((id: string, update: Partial<Pick<OrderLine, "quantity" | "enteredUnit">>) => {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...update } : line));
    setProblems((current) => current.filter((problem) => problem.id !== id));
  }, []);
  const remove = useCallback((id: string) => setLines((current) => current.length > 1 ? current.filter((line) => line.id !== id) : current), []);
  const invalid = useMemo(() => new Set(problems.map((problem) => problem.id)), [problems]);
  const saving = mutation.isLoading;

  const save = async () => {
    setMessage("");
    const found = orderLineProblems(lines);
    setProblems(found);
    if (found.length > 0) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await correct({ requisitionId: requisition.id, body: { requisitionType: requisitionType.purchase, comments: requisition.comments,
      expectedDelivery: requisition.expectedDelivery, items: toRequisitionItems(lines) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Requisition corrected", { description: requisition.code });
    onClose();
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>Correct {requisition.code}</DialogTitle>
        <DialogDescription>Correct the quantities or remove a line before the requisition goes for approval. The correction is recorded on its review.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <OrderLinesTable lines={lines} invalid={invalid} onChange={change} onRemove={remove} />
        {problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{problems.map((problem) => <li key={problem.id}>{problem.message}</li>)}</ul> : null}
        {message || !permission.allowed ? <p role="alert" className="text-sm text-destructive">{message || permissionDeniedMessage}</p> : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={saving || !permission.allowed} onClick={() => void save()}>{saving ? <><Spinner />Saving…</> : "Save correction"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
