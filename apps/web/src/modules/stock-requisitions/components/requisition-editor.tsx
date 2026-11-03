import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { newItemLine } from "@/shared/inventory/item-line-model";
import { stores, type Store } from "@/shared/inventory/stores";
import { workflowRule } from "@/shared/inventory/workflows";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { requisitionFormSchema, type RequisitionFormValues } from "../schemas/requisition-form";
import { editable, stockRequisitionAudit, stockRequisitionCodeModel, stockRequisitionSchema, type StockRequisition } from "../lib/stock-requisitions";

const loadLines = () => import("./requisition-lines-field");

/**
 * Raises or edits a stock requisition for one store: its number, the requesting department, why it is needed and the items.
 * An edit re-reads the requisition first and stops if stock has been issued against it or someone else changed it.
 */
export function RequisitionEditor({ store, requisition, onClose, onSaved }: {
  store: Store; requisition: StockRequisition | null; onClose: () => void; onSaved: (id: string) => void;
}) {
  const user = useCurrentUser();
  const permission = usePermissionAction(workflowRule(store, "stockRequisitions", "create"));
  const code = useGeneratedCode(stockRequisitionCodeModel);
  const [loadDepartments] = departmentApi.useLazyGetApiV1DepartmentQuery();
  const [reread] = inventoryApi.useLazyGetApiV1ItemsStockRequisitionsByIdQuery();
  const [create, creating] = inventoryApi.usePostApiV1ItemsStockRequisitionsMutation();
  const [update, updating] = inventoryApi.usePutApiV1ItemsStockRequisitionsByIdMutation();
  const userDepartment = user?.departmentId ? { value: user.departmentId, label: user.department ?? "My department" } : null;
  const [initialLines] = useState(() => {
    if (!requisition) return [newItemLine()];
    return requisition.lines.map((line) => {
      const choice = { id: line.itemId, name: line.name, code: line.code, classification: line.classification, available: line.available, unitId: "", unitName: line.unitName, unitSymbol: line.unit };
      return newItemLine(choice, String(line.requested));
    });
  });
  const form = useForm<RequisitionFormValues>({ resolver: zodResolver(requisitionFormSchema), defaultValues: {
    store, lines: initialLines,
    number: requisition?.number ?? "", justification: requisition?.justification ?? "",
    department: requisition?.department ? { value: requisition.department.id, label: requisition.department.name } : userDepartment,
  } });
  const [message, setMessage] = useState("");
  const saving = creating.isLoading || updating.isLoading || form.formState.isSubmitting;

  // Suggest a number once for a new requisition, without overwriting one the user typed.
  const suggested = useRef(false);
  useEffect(() => {
    if (requisition || !code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next && !form.getValues("number")) form.setValue("number", next); });
  }, [code, requisition, form]);

  const departments = useCallback<SelectLoader>(async (searchQuery, page, signal) => {
    signal.throwIfAborted();
    const request = loadDepartments({ ...departmentAudit, searchQuery, page, pageSize: 30 }, true);
    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });
    const result = await request.finally(() => signal.removeEventListener("abort", abort));
    if (result.error) throw new Error("Departments could not be loaded.");
    const data = result.data;
    return { options: (data?.data ?? []).flatMap((d) => d.id ? [{ value: d.id, label: d.name ?? "Unnamed department" }] : []),
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [loadDepartments]);

  const fields = useMemo<readonly WizardField<RequisitionFormValues>[]>(() => [
      { type: InputTypes.TEXT, name: "number", label: "Requisition number", required: true, readOnly: Boolean(requisition),
        description: requisition ? "" : code.unavailable ? "No numbering rule is set up; enter the number yourself." : "Suggested from the next in the series. You can change it." },
      { type: InputTypes.SELECT, mode: "single", source: "async", name: "department", label: "Requesting department", required: true, loadOptions: departments, placeholder: "Choose a department" },
      { type: InputTypes.TEXTAREA, name: "justification", label: "Justification", required: true, rows: 3, placeholder: "Why the items are needed", className: "md:col-span-2" },
    { type: InputTypes.CUSTOM, name: "lines", label: "Items", load: loadLines, className: "md:col-span-2" },
  ], [requisition, code.unavailable, departments]);
  const save = form.handleSubmit(async ({ number, department, justification, lines }) => {
    setMessage("");
    if (!department || !user) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (requisition) {
      const fresh = await reread({ ...stockRequisitionAudit, id: requisition.id }, false);
      if (fresh.error) { setMessage(apiErrorMessage(fresh.error)); return; }
      const current = stockRequisitionSchema.safeParse(fresh.data);
      if (!current.success || !editable(current.data)) { setMessage("Stock has been issued against this requisition, so it can no longer be changed."); return; }
    }
    const writeDenied = permission.check();
    if (writeDenied) { setMessage(writeDenied); return; }
    const body = {
      number: number.trim(), requestedById: requisition?.requestedBy?.id ?? user.id, departmentId: department.value, justification: justification.trim(),
      stockItems: lines.flatMap((line) => line.item ? [{ itemId: line.item.id, quantityRequested: Number(line.quantity) }] : []),
    };
    const result = requisition
      ? await update({ ...stockRequisitionAudit, id: requisition.id, domainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest: body })
      : await create({ ...stockRequisitionAudit, domainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(requisition ? "Stock requisition updated" : "Stock requisition raised");
    onSaved(requisition?.id ?? (typeof result.data === "string" ? result.data : ""));
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{requisition ? `Edit ${requisition.number}` : `Raise a ${(stores[store] ?? "store").toLowerCase()} stock requisition`}</DialogTitle>
        <DialogDescription>Items from the {(stores[store] ?? "store").toLowerCase()} for a department. Every item must come from this store.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.stopPropagation(); void save(event); }}>
        <DialogBody className="space-y-4">
          <fieldset disabled={saving}><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></fieldset>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : requisition ? "Save requisition" : "Raise requisition"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
