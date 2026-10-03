import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { relatedUnits } from "@/shared/units/quantity";
import { useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery } from "../api/order-api";
import { audit } from "../lib/purchase-order-access";
import type { AddedLine } from "../lib/revision-draft";

const text = z.string().nullish().transform((value) => value?.trim() || null);
/** What a supplier is set up to supply, each with the unit it is supplied in. A material listed for several manufacturers appears once. */
const suppliedSchema = z.array(z.object({ material: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish() })).nullish()
  .transform((value) => { const seen = new Set<string>(); return (value ?? []).flatMap((entry) => {
    const id = entry.material?.id;
    if (!id || !entry.uoM?.id || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name: entry.material?.name ?? "Unnamed material", code: entry.material?.code ?? null, unit: entry.uoM.symbol, unitId: entry.uoM.id }];
  }); });

const option = z.object({ value: z.string().min(1), label: z.string() });
const amount = (what: string) => z.number({ message: `Enter the ${what}` }).finite(`Enter the ${what}`).positive(`The ${what} must be above zero`);
const schema = z.object({
  // Empty until chosen; checked on the field so its message shows with the others.
  material: option.nullable().refine((value): boolean => Boolean(value), "Choose the material"),
  quantity: amount("quantity"), price: amount("price"),
  priceUnit: option.nullable().refine((value): boolean => Boolean(value), "Choose the unit the price is per"),
});
type Values = z.infer<typeof schema>;

/** Adds a material the supplier supplies to the order being revised. It is saved with the rest of the revision. */
export function AddLineDialog({ supplierId, currency, onOrder, onAdd, onClose }: { supplierId: string; currency: string | null; onOrder: ReadonlySet<string>; onAdd: (line: AddedLine) => void; onClose: () => void }) {
  const query = useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery({ ...audit, supplierId }, { skip: !supplierId });
  // A material already on the order is changed on its own line, not added a second time.
  const supplied = useMemo(() => { const parsed = suppliedSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data.filter((item) => !onOrder.has(item.id)) : []; }, [query.data, onOrder]);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { material: null, quantity: Number.NaN, price: Number.NaN, priceUnit: null } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const chosen = useWatch({ control: form.control, name: "material" });
  const material = supplied.find((item) => item.id === chosen?.value) ?? null;
  const fields = useMemo((): WizardField<Values>[] => [
    { type: InputTypes.SELECT, name: "material", label: "Material", mode: "single", source: "sync", required: true, className: "md:col-span-2",
      options: supplied.map((item) => ({ value: item.id, label: item.code ? `${item.code} - ${item.name}` : item.name })),
      placeholder: query.isLoading ? "Loading…" : supplied.length ? "Select a material" : "This supplier supplies nothing else" },
    { type: InputTypes.NUMBER, name: "quantity", label: `Quantity${material?.unit ? ` (${material.unit})` : ""}`, required: true, min: 0 },
    { type: InputTypes.NUMBER, name: "price", label: `Unit price${currency ? ` (${currency})` : ""}`, required: true, min: 0 },
    { type: InputTypes.SELECT, name: "priceUnit", label: "Priced per", mode: "single", source: "sync", required: true,
      options: (material ? relatedUnits(material.unit) : []).map((unit) => ({ value: unit, label: unit })), placeholder: material ? "Select a unit" : "Choose the material first" },
  ], [supplied, query.isLoading, material, currency]);

  const submit = form.handleSubmit((values) => {
    if (!material || !values.priceUnit) return;
    onAdd({ id: `new-${material.id}`, materialId: material.id, materialName: material.name, unit: material.unit, unitId: material.unitId, quantity: values.quantity, price: values.price, priceUnit: values.priceUnit.value });
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Add a line</DialogTitle><DialogDescription>Only materials this supplier is set up to supply can be added. The line is saved with the rest of the revision.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {query.error ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{apiErrorMessage(query.error)}<Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></p> : null}
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Add to the revision</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
