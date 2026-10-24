import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery } from "@/shared/api/generated/procurement";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { useMaterialPurchaseUnitsQuery } from "@/shared/reference-data/material-purchase-units";
import { purchaseUnitOptions, purchaseUnitDisplayOptions, purchaseUnitSymbol } from "@/shared/procurement/purchase-units";
import { materialChoices } from "./material-choices";
import { useCreatePricingMutation, useUpdatePricingMutation } from "./relationship-api";
import { pricingSchema, type PricingValues } from "./schemas";
import type { PricingAgreement, PricingRequest } from "./types";

export function PricingDialog({ supplierId, record, open, onOpenChange }: {
  supplierId: string; record?: PricingAgreement; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const associations = useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery({ supplierId });
  const collections = usePartnerCollections("currency");
  const [create, creating] = useCreatePricingMutation();
  const [update, updating] = useUpdatePricingMutation();
  const [error, setError] = useState("");
  const permission = usePermissionAction("CanManageSupplierContracts");
  const choices = useMemo(() => materialChoices(associations.data), [associations.data]);
  const form = useForm<PricingValues>({ resolver: zodResolver(pricingSchema), defaultValues: {
    material: record ? { value: `${record.materialId}:${record.uoMId}`, label: record.materialName } : null,
    currency: record?.currency ? { value: record.currency.id, label: record.currency.name } : null,
    agreedPrice: record?.agreedPrice ?? 0, priceUoM: record?.priceUoM ? { value: purchaseUnitSymbol(record.priceUoM), label: purchaseUnitSymbol(record.priceUoM) } : null,
    effectiveFrom: formDate(record?.effectiveFrom) ?? new Date(), effectiveTo: formDate(record?.effectiveTo),
    notes: record?.notes ?? "",
  } });
  const material = useWatch({ control: form.control, name: "material" });
  const selected = choices.find((choice) => choice.key === material?.value);
  const linkedUnits = useMaterialPurchaseUnitsQuery({ materialId: selected?.materialId ?? "", module: "Supplier relationship management", subModule: "Pricing agreements" }, { skip: !selected?.materialId });
  const priceUnit = useWatch({ control: form.control, name: "priceUoM" });
  const unitOptions = purchaseUnitDisplayOptions(purchaseUnitOptions(linkedUnits.currentData ?? []), priceUnit);
  const previousMaterial = useRef(material?.value);
  useEffect(() => {
    if (previousMaterial.current !== material?.value) form.setValue("priceUoM", selected?.uomSymbol ? { value: selected.uomSymbol, label: selected.uomSymbol } : null, { shouldDirty: true });
    previousMaterial.current = material?.value;
  }, [form, material?.value, selected?.uomSymbol]);
  const fields = [
    { type: InputTypes.SELECT, name: "material", label: "Associated material and unit", mode: "single", source: "sync",
      options: choices.map((choice) => ({ value: choice.key, label: `${choice.materialName} (${choice.uomSymbol})` })), required: true, className: "sm:col-span-2" },
    { type: InputTypes.NUMBER, name: "agreedPrice", label: "Agreed price", min: 0.01, step: 0.01, required: true },
    { type: InputTypes.SELECT, name: "priceUoM", label: "Price per unit", mode: "single", source: "sync", options: unitOptions, disabled: linkedUnits.isFetching || !selected, required: true },
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: collections.currencies, required: true },
    { type: InputTypes.DATE, name: "effectiveFrom", label: "Effective from", required: true },
    { type: InputTypes.DATE, name: "effectiveTo", label: "Effective to (optional)" },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", className: "sm:col-span-2" },
  ] as const satisfies readonly WizardField<PricingValues>[];
  const busy = creating.isLoading || updating.isLoading;
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setError(denied); return; }
      const choice = choices.find((item) => item.key === values.material?.value);
      if (!choice || !values.currency || !values.priceUoM) { setError("Choose a material currently linked to this supplier and a currency."); return; }
      if (!purchaseUnitOptions(linkedUnits.currentData ?? []).some((unit) => unit.value === values.priceUoM?.value)) {
        setError("Choose a price unit linked to this material in any department."); return;
      }
      const body: PricingRequest = {
        materialId: choice.materialId, uoMId: choice.uomId, agreedPrice: values.agreedPrice,
        priceUoM: purchaseUnitSymbol(values.priceUoM.value), currencyId: values.currency.value,
        effectiveFrom: utcBoundary(values.effectiveFrom), effectiveTo: values.effectiveTo ? utcBoundary(values.effectiveTo, true) : null,
        notes: values.notes,
      };
      const result = record ? await update({ supplierId, id: record.id, body }) : await create({ supplierId, body });
      if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
      toast.success("Pricing proposal submitted for approval"); onOpenChange(false);
    })();
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle>{record ? "Propose pricing change" : "Propose pricing agreement"}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => void save(event)} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><p className="mb-3 text-xs text-muted-foreground">Submission creates an approval proposal. Existing approved pricing remains effective until approval.</p>
        <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        {!associations.isLoading && choices.length === 0 ? <p role="alert" className="mt-2 text-sm text-destructive">Add a supplier material association with a unit before pricing it.</p> : null}
        {linkedUnits.error ? <p role="alert" className="mt-2 text-sm text-destructive">Material units could not be loaded. <Button type="button" variant="link" onClick={() => void linkedUnits.refetch()}>Retry units</Button></p> : null}
        {associations.error || collections.error ? <p role="alert" className="mt-2 text-sm text-destructive">{associations.error ? apiErrorMessage(associations.error) : collections.error}</p> : null}
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" disabled={busy || !permission.allowed || associations.isLoading || collections.loading || linkedUnits.isFetching || Boolean(linkedUnits.error) || choices.length === 0}>{busy ? <><Spinner />Submitting…</> : "Submit proposal"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
