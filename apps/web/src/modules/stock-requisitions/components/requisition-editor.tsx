import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { departmentApi, departmentAudit } from "@/modules/departments/departments";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { AsyncOptionPicker } from "@/shared/forms/async-option-picker";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { ItemLinesEditor, itemLineProblems, newItemLine, type ItemLine } from "@/shared/inventory/item-lines";
import { stores, type Store } from "@/shared/inventory/stores";
import { useItemChoices } from "@/shared/inventory/use-item-choices";
import { workflowRule } from "@/shared/inventory/workflows";
import { editable, stockRequisitionAudit, stockRequisitionCodeModel, stockRequisitionSchema, type StockRequisition } from "../lib/stock-requisitions";

/**
 * Raises or edits a stock requisition for one store: its number, the requesting department, why it is needed and the items.
 * An edit re-reads the requisition first and stops if stock has been issued against it or someone else changed it.
 */
export function RequisitionEditor({ store, requisition, onClose, onSaved }: {
  store: Store; requisition: StockRequisition | null; onClose: () => void; onSaved: (id: string) => void;
}) {
  const user = useCurrentUser();
  const permission = usePermissionAction(workflowRule(store, "stockRequisitions", "create"));
  const items = useItemChoices(store, stockRequisitionAudit);
  const code = useGeneratedCode(stockRequisitionCodeModel);
  const [loadDepartments] = departmentApi.useLazyGetApiV1DepartmentQuery();
  const [reread] = inventoryApi.useLazyGetApiV1ItemsStockRequisitionsByIdQuery();
  const [create, creating] = inventoryApi.usePostApiV1ItemsStockRequisitionsMutation();
  const [update, updating] = inventoryApi.usePutApiV1ItemsStockRequisitionsByIdMutation();
  const [number, setNumber] = useState(requisition?.number ?? "");
  const [justification, setJustification] = useState(requisition?.justification ?? "");
  const userDepartment = user?.departmentId ? { value: user.departmentId, label: user.department ?? "My department" } : null;
  const [department, setDepartment] = useState<SelectOption | null>(requisition?.department ? { value: requisition.department.id, label: requisition.department.name } : userDepartment);
  const [lines, setLines] = useState<ItemLine[]>(() => {
    if (!requisition) return [newItemLine()];
    return requisition.lines.map((line) => {
      const choice = { id: line.itemId, name: line.name, code: line.code, classification: line.classification, available: line.available, unitId: "", unitName: line.unitName, unitSymbol: line.unit };
      items.remember(choice);
      return newItemLine(choice, String(line.requested));
    });
  });
  const [problems, setProblems] = useState<Map<string, string>>(new Map());
  const [message, setMessage] = useState("");
  const saving = creating.isLoading || updating.isLoading;

  // Suggest a number once for a new requisition, without overwriting one the user typed.
  const suggested = useRef(false);
  useEffect(() => {
    if (requisition || !code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next) setNumber((current) => current || next); });
  }, [code, requisition]);

  const departments = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await loadDepartments({ ...departmentAudit, searchQuery, page, pageSize: 30 }, true);
    if (result.error) throw new Error("Departments could not be loaded.");
    const data = result.data;
    return { options: (data?.data ?? []).flatMap((d) => d.id ? [{ value: d.id, label: d.name ?? "Unnamed department" }] : []),
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [loadDepartments]);

  const fieldProblems = useMemo(() => ({
    number: !number.trim() ? "Enter the requisition number." : null,
    department: !department ? "Choose the requesting department." : null,
    justification: !justification.trim() ? "Say why the items are needed." : null,
  }), [department, justification, number]);
  const [showFieldProblems, setShowFieldProblems] = useState(false);

  const save = async () => {
    setMessage(""); setShowFieldProblems(true);
    const found = itemLineProblems(lines, { capToStock: true });
    setProblems(found);
    if (found.size > 0 || Object.values(fieldProblems).some(Boolean) || !department || !user) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (requisition) {
      const fresh = await reread({ ...stockRequisitionAudit, id: requisition.id }, false);
      if (fresh.error) { setMessage(apiErrorMessage(fresh.error)); return; }
      const current = stockRequisitionSchema.safeParse(fresh.data);
      if (!current.success || !editable(current.data)) { setMessage("Stock has been issued against this requisition, so it can no longer be changed."); return; }
    }
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
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{requisition ? `Edit ${requisition.number}` : `Raise a ${(stores[store] ?? "store").toLowerCase()} stock requisition`}</DialogTitle>
        <DialogDescription>Items from the {(stores[store] ?? "store").toLowerCase()} for a department. Every item must come from this store.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void save(); }}>
        <DialogBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="requisition-number">Requisition number <span className="text-destructive">*</span></Label>
              <Input id="requisition-number" value={number} disabled={Boolean(requisition)} onChange={(event) => setNumber(event.target.value)} aria-invalid={showFieldProblems && fieldProblems.number ? true : undefined} />
              {!requisition ? <p className="text-xs text-muted-foreground">{code.unavailable ? "No numbering rule is set up; enter the number yourself." : "Suggested from the next in the series. You can change it."}</p> : null}
              {showFieldProblems && fieldProblems.number ? <p role="alert" className="text-xs text-destructive">{fieldProblems.number}</p> : null}</div>
            <div className="space-y-1.5"><Label>Requesting department <span className="text-destructive">*</span></Label>
              <AsyncOptionPicker label="Requesting department" value={department} onChange={setDepartment} loadOptions={departments} placeholder="Choose a department" />
              {showFieldProblems && fieldProblems.department ? <p role="alert" className="text-xs text-destructive">{fieldProblems.department}</p> : null}</div>
            <div className="space-y-1.5 md:col-span-2"><Label htmlFor="requisition-justification">Justification <span className="text-destructive">*</span></Label>
              <Textarea id="requisition-justification" rows={3} value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Why the items are needed" />
              {showFieldProblems && fieldProblems.justification ? <p role="alert" className="text-xs text-destructive">{fieldProblems.justification}</p> : null}</div>
          </div>
          <ItemLinesEditor lines={lines} onChange={(next) => { setLines(next); setProblems(new Map()); }} loadItems={items.loadOptions} label={items.label} lookup={(id) => items.lookup(id)} problems={problems} />
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
