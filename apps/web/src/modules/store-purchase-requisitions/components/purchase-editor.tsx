import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { newItemLine } from "@/shared/inventory/item-line-model";
import { Classification } from "@/shared/inventory/contracts";
import { stores, type Store } from "@/shared/inventory/stores";
import { workflowRule } from "@/shared/inventory/workflows";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { purchaseFormSchema, type PurchaseFormValues } from "../schemas/purchase-form";
import { purchaseEditable, purchaseRequisitionAudit, purchaseRequisitionCodeModel, purchaseRequisitionSchema, type PurchaseRequisition } from "../lib/purchase-requisitions";

const loadLines = () => import("./purchase-lines-field");

const today = () => new Date().toISOString().slice(0, 10);

/** Raises or edits a store purchase requisition. Edits re-read it first and stop once any item has been sourced. */
export function PurchaseRequisitionEditor({ store, requisition, onClose, onSaved }: {
  store: Store; requisition: PurchaseRequisition | null; onClose: () => void; onSaved: (id: string) => void;
}) {
  const permission = usePermissionAction(workflowRule(store, "purchaseRequisitions", requisition ? "edit" : "create"));
  const code = useGeneratedCode(purchaseRequisitionCodeModel);
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryByIdQuery();
  const [create, creating] = inventoryApi.usePostApiV1ProcurementInventoryMutation();
  const [update, updating] = inventoryApi.usePutApiV1ProcurementInventoryByIdMutation();
  const [initialLines] = useState(() => requisition ? requisition.lines.map((line) => {
    const choice = { id: line.itemId, name: line.name, code: line.code, classification: line.classification === Classification.NonRecoverable ? Classification.NonRecoverable : Classification.Recoverable, available: line.available, unitId: line.unitId, unitName: line.unitName, unitSymbol: line.unit || null };
    return newItemLine(choice, String(line.quantity));
  }) : [newItemLine()]);
  const form = useForm<PurchaseFormValues>({ resolver: zodResolver(purchaseFormSchema(Boolean(requisition))), defaultValues: {
    store, lines: initialLines,
    number: requisition?.code ?? "", delivery: formDate(requisition?.expectedDelivery), remarks: requisition?.remarks ?? "",
  } });
  const [message, setMessage] = useState("");
  const saving = creating.isLoading || updating.isLoading || form.formState.isSubmitting;
  const suggested = useRef(false);
  useEffect(() => {
    if (requisition || !code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next && !form.getValues("number")) form.setValue("number", next); });
  }, [code, requisition, form]);
  const fields = useMemo<readonly WizardField<PurchaseFormValues>[]>(() => [
    { type: InputTypes.TEXT, name: "number", label: "Requisition number", required: true, readOnly: Boolean(requisition),
      description: requisition ? "" : code.unavailable ? "No numbering rule is set up; enter the number yourself." : "Suggested from the next in the series. You can change it." },
    { type: InputTypes.DATE, name: "delivery", label: "Expected delivery", ...(requisition ? {} : { minDate: formDate(today()) ?? new Date() }) },
    { type: InputTypes.TEXTAREA, name: "remarks", label: "Remarks", rows: 3, placeholder: "Anything Procurement should know", className: "md:col-span-2" },
    { type: InputTypes.CUSTOM, name: "lines", label: "Items", load: loadLines, className: "md:col-span-2" },
  ], [requisition, code.unavailable]);
  const save = form.handleSubmit(async ({ number, delivery, remarks, lines }) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (requisition) {
      const fresh = await reread({ ...purchaseRequisitionAudit, id: requisition.id }, false);
      if (fresh.error) { setMessage(apiErrorMessage(fresh.error)); return; }
      const current = purchaseRequisitionSchema.safeParse(fresh.data);
      if (!current.success || !purchaseEditable(current.data)) { setMessage("Items on this requisition have been sourced, so it can no longer be changed."); return; }
    }
    const writeDenied = permission.check();
    if (writeDenied) { setMessage(writeDenied); return; }
    const body = {
      code: number.trim(), expectedDeliveryDate: delivery ? utcBoundary(delivery) : null, remarks: remarks.trim() || null,
      items: lines.flatMap((line) => line.item ? [{ itemId: line.item.id, uoMId: line.item.unitId, quantity: Number(line.quantity) }] : []),
    };
    const result = requisition
      ? await update({ ...purchaseRequisitionAudit, id: requisition.id, domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition: body })
      : await create({ ...purchaseRequisitionAudit, domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(requisition ? "Purchase requisition updated" : "Purchase requisition raised", { description: requisition ? undefined : "Procurement can now source it." });
    onSaved(requisition?.id ?? (typeof result.data === "string" ? result.data : ""));
  });

  const storeName = (stores[store] ?? "store").toLowerCase();
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{requisition ? `Edit ${requisition.code}` : `Raise a ${storeName} purchase requisition`}</DialogTitle>
        <DialogDescription>Items the {storeName} needs bought. Every item must be from this store.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.stopPropagation(); void save(event); }}>
        <DialogBody className="space-y-4">
          <fieldset disabled={saving}><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></fieldset>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : requisition ? "Save requisition" : "Raise requisition"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
