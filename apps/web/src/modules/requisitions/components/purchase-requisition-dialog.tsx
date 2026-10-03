import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePostApiV1RequisitionMutation } from "../api/requisition-api";
import { orderLineProblems, toRequisitionItems, type OrderLine } from "../lib/order-lines";
import { createAudit, requisitionCodeModel } from "../lib/requisition-access";
import { requisitionType } from "../lib/requisition-status";
import { purchaseRequisitionFormSchema, type PurchaseRequisitionFormValues } from "../schemas/requisition-schema";
import { OrderLinesTable } from "./order-lines-table";

function startOfToday(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }

/**
 * Raises a purchase requisition for the given lines. It then waits for approval before Procurement can source it.
 * `batchId` ties it to the scheduled batch the materials are for; the server then refuses a second requisition for the same material.
 */
export function PurchaseRequisitionDialog({ initialLines, batchId, description, onClose, onCreated }: {
  initialLines: readonly OrderLine[]; batchId?: string; description?: string; onClose: () => void; onCreated: () => void;
}) {
  const [lines, setLines] = useState<OrderLine[]>(() => [...initialLines]);
  const [problems, setProblems] = useState<readonly { id: string; message: string }[]>([]);
  const [message, setMessage] = useState("");
  const code = useGeneratedCode(requisitionCodeModel);
  const [create, mutation] = usePostApiV1RequisitionMutation();
  const form = useForm<PurchaseRequisitionFormValues>({ resolver: zodResolver(purchaseRequisitionFormSchema), defaultValues: { code: "", expectedDelivery: null, comments: "" } });
  const [fields] = useState((): WizardField<PurchaseRequisitionFormValues>[] => [
    { type: InputTypes.TEXT, name: "code", label: "Requisition number", required: true },
    { type: InputTypes.DATE, name: "expectedDelivery", label: "Needed by", minDate: startOfToday() },
    { type: InputTypes.TEXTAREA, name: "comments", label: "Remarks", rows: 2, placeholder: "Anything Procurement should know", className: "md:col-span-2" },
  ]);

  const suggestCode = async (replace: boolean) => {
    const next = await code.suggest();
    if (next && (replace || !form.getValues("code"))) form.setValue("code", next, { shouldValidate: true });
  };
  // Offer a number once, when the rule has loaded, without overwriting what the user typed meanwhile.
  const suggested = useRef(false);
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void suggestCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code.ready]);

  const change = useCallback((id: string, update: Partial<Pick<OrderLine, "quantity" | "enteredUnit">>) => {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...update } : line));
    setProblems((current) => current.filter((problem) => problem.id !== id));
  }, []);
  const remove = useCallback((id: string) => setLines((current) => current.length > 1 ? current.filter((line) => line.id !== id) : current), []);
  const invalid = useMemo(() => new Set(problems.map((problem) => problem.id)), [problems]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const found = orderLineProblems(lines);
    setProblems(found);
    if (found.length > 0) return;
    const result = await create({ ...createAudit, domainEntitiesRequisitionsRequestCreateRequisitionRequest: {
      requisitionType: requisitionType.purchase, code: values.code, comments: values.comments || null,
      expectedDelivery: values.expectedDelivery ? values.expectedDelivery.toISOString() : null, items: toRequisitionItems(lines),
      ...(batchId ? { productionScheduleProductId: batchId } : {}),
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Purchase requisition raised", { description: "It goes to Procurement once it is approved." });
    onCreated();
  });
  const saving = mutation.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>Raise a purchase requisition</DialogTitle>
        <DialogDescription>{description ?? "Enter how much of each material to order. The requisition is sent for approval, then to Procurement."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {code.unavailable ? "No numbering rule is set up for requisitions; enter the number yourself." : "The number is suggested from the next in the series. You can change it."}
            {code.ready ? <Button type="button" size="xs" variant="ghost" disabled={code.busy} onClick={() => void suggestCode(true)}>Suggest again</Button> : null}
          </p>
          <OrderLinesTable lines={lines} invalid={invalid} onChange={change} onRemove={remove} />
          {problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{problems.map((problem) => <li key={problem.id}>{problem.message}</li>)}</ul> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Raising…</> : "Raise requisition"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
