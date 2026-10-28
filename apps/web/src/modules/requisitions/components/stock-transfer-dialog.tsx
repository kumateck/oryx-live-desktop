import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery, useLazyGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery, usePostApiV1ProductionScheduleStockTransferMutation } from "../api/stock-api";
import { inMaterialUnit, sourceProblems, stockTransferRequest, type TransferMaterial } from "../lib/stock-transfer";
import { departmentOptionsSchema, stockTransferFormSchema, type StockTransferFormValues } from "../schemas/stock-schema";

const audit = { module: "Production", subModule: "Stock Transfer Requests" } as const;
type Form = UseFormReturn<StockTransferFormValues>;

function SourceLine({ form, index, material, units, onRemove }: { form: Form; index: number; material: TransferMaterial; units: readonly string[]; onRemove: (() => void) | null }) {
  const ownDepartment = useCurrentUser()?.departmentId ?? null;
  const quantity = useWatch({ control: form.control, name: `sources.${index}.quantity` });
  const unit = useWatch({ control: form.control, name: `sources.${index}.unit` });
  const needed = Number.isFinite(quantity) && quantity > 0 && unit ? inMaterialUnit(quantity, unit.value, material) : null;
  // Only departments holding at least this much can be asked, so the list follows the quantity.
  const query = useGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery({ ...audit, materialId: material.id, quantity: needed ?? 0 }, { skip: needed === null });
  const departments = useMemo(() => { const parsed = departmentOptionsSchema.safeParse(needed === null ? null : query.data ?? null);
    return parsed.success ? parsed.data.filter((option) => option.value !== ownDepartment) : []; }, [query.data, needed, ownDepartment]);
  const chosen = useWatch({ control: form.control, name: `sources.${index}.department` });
  // A department that no longer holds enough for the new quantity is not a choice any more.
  useEffect(() => {
    if (chosen && !query.isFetching && needed !== null && query.data && !departments.some((option) => option.value === chosen.value)) form.setValue(`sources.${index}.department`, null);
  }, [chosen, departments, form, index, needed, query.data, query.isFetching]);
  const fields = useMemo((): WizardField<StockTransferFormValues>[] => [
    { type: InputTypes.NUMBER, name: `sources.${index}.quantity`, label: "Quantity", required: true, min: 0 },
    ...(units.length > 1 ? [{ type: InputTypes.SELECT, name: `sources.${index}.unit`, label: "Unit", mode: "single", source: "sync", options: units.map((value) => ({ value, label: value })), required: true } as const] : []),
    { type: InputTypes.SELECT, name: `sources.${index}.department`, label: "From department", mode: "single", source: "sync", options: departments, required: true,
      placeholder: needed === null ? "Enter the quantity first" : query.isFetching ? "Checking who holds enough…" : departments.length ? "Select a department" : "No other department holds this much" },
  ], [index, units, departments, needed, query.isFetching]);
  return <li className="flex items-start gap-2 rounded-md border p-3">
    <FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-3" />
    {onRemove ? <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove source ${index + 1}`} onClick={onRemove}><Trash2 /></Button> : null}
  </li>;
}

/** Asks other departments to release stock of a material to the user's department, instead of buying it. */
export function StockTransferDialog({ material, require, onClose }: { material: TransferMaterial; require: string; onClose: () => void }) {
  const permission = usePermissionAction(require);
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const [readStock] = useLazyGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery();
  const [checking, setChecking] = useState(false);
  const inFlight = useRef(false);
  const units = useMemo(() => { const family = relatedUnits(material.unit); return family.length ? family : [material.unit ?? ""]; }, [material.unit]);
  // Quantities are typed in the largest unit of the material's family unless another is chosen.
  const unit = useMemo(() => { const largest = units.at(-1) ?? ""; return { value: largest, label: largest }; }, [units]);
  const code = useGeneratedCode("StockTransfer");
  const [create, mutation] = usePostApiV1ProductionScheduleStockTransferMutation();
  const [message, setMessage] = useState("");
  const form = useForm<StockTransferFormValues>({ resolver: zodResolver(stockTransferFormSchema), defaultValues: { code: "", reason: "", sources: [{ quantity: Number.NaN, unit, department: null }] } });
  const sources = useFieldArray({ control: form.control, name: "sources" });
  const listError = form.formState.errors.sources?.root?.message ?? form.formState.errors.sources?.message;
  const [header] = useState((): WizardField<StockTransferFormValues>[] => [
    { type: InputTypes.TEXT, name: "code", label: "Request number", required: true },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason", rows: 2, placeholder: "Why the stock is needed" },
  ]);
  const suggested = useRef(false);
  useEffect(() => {
    if (!code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next && !form.getValues("code")) form.setValue("code", next, { shouldValidate: true }); });
  }, [code, form]);

  const submit = form.handleSubmit(async (values) => {
    if (inFlight.current) return;
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!departmentId || !material.unitId) { setMessage("A department and material unit are required to request a transfer."); return; }
    const problems = sourceProblems(values.sources);
    for (const problem of problems) form.setError(`sources.${problem.index}.department`, { message: problem.message });
    if (problems.length > 0) return;
    inFlight.current = true; setChecking(true);
    try {
      for (const source of values.sources) {
        const quantity = inMaterialUnit(source.quantity, source.unit.value, material);
        if (!source.department || source.department.value === departmentId) { setMessage("Choose another supplying department."); return; }
        const fresh = await readStock({ ...audit, materialId: material.id, quantity }, false);
        if ("error" in fresh) { setMessage(apiErrorMessage(fresh.error)); return; }
        const parsed = departmentOptionsSchema.safeParse(fresh.data);
        if (!parsed.success || !parsed.data.some((entry) => entry.value === source.department?.value)) {
          setMessage(`${source.department.label} no longer holds enough for this request. Review the quantities and sources.`); return;
        }
      }
      const revoked = permission.check();
      if (revoked) { setMessage(revoked); return; }
      const result = await create({ ...audit, domainEntitiesProductionSchedulesStockTransfersRequestCreateStockTransferRequest: stockTransferRequest(material, values) });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Stock transfer requested", { description: "The departments asked will see it in their transfer requests." });
      onClose();
    } finally { inFlight.current = false; setChecking(false); }
  });
  const saving = mutation.isLoading || checking;
  const show = (value: number) => toLargestUnit(value, material.unit, "calculated")?.text ?? String(value);

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Request stock from another department</DialogTitle>
        <DialogDescription>Ask one or more departments to release this material to yours. Each must hold at least what you ask it for.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-3">
            <div className="min-w-0"><dt className="text-xs text-muted-foreground">Material</dt><dd className="break-words font-medium">{material.name}</dd></div>
            <div><dt className="text-xs text-muted-foreground">In your warehouse</dt><dd className="font-medium">{show(material.stock)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Held elsewhere</dt><dd className="font-medium">{show(material.elsewhere)}</dd></div>
          </dl>
          <FormWizard form={form} fields={header} className="md:grid-cols-2" />
          <ul className="space-y-2">{sources.fields.map((field, index) => <SourceLine key={field.id} form={form} index={index} material={material} units={units}
            onRemove={sources.fields.length > 1 ? () => sources.remove(index) : null} />)}</ul>
          <Button type="button" size="sm" variant="outline" onClick={() => sources.append({ quantity: Number.NaN, unit, department: null })}><Plus />Ask another department</Button>
          {message || listError ? <p role="alert" className="text-sm text-destructive">{message || listError}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !permission.allowed}>{saving ? <><Spinner />Sending…</> : "Send request"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
