import { useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MaterialQuantityFields, type MaterialQuantityField } from "@/modules/products/components/material-quantity-fields";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { randomId } from "@/shared/ids/random-id";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKindLabels, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useDepartmentMaterials, useDepartmentShelves } from "../hooks/use-top-up-sources";
import { sameLot, type TopUpLine } from "../lib/top-up";
import { topUpLineFormSchema, type TopUpLineFormValues } from "../schemas/top-up-schema";

const kinds = [{ value: "0", label: materialKindLabels[0] }, { value: "1", label: materialKindLabels[1] }];
const quantityFields: readonly MaterialQuantityField<TopUpLineFormValues>[] = [
  { name: "quantity", label: "Quantity in stock", required: true, description: "What is physically on the shelf for this batch." },
];

function startValues(line: TopUpLine | null): TopUpLineFormValues {
  return line ? {
    kind: String(line.kind) as "0" | "1", material: { value: line.material.id, label: line.material.code ? `${line.material.code} · ${line.material.name}` : line.material.name },
    shelf: { value: line.shelf.id, label: line.shelf.label }, batchNumber: line.batchNumber, arNumber: line.arNumber, grn: line.grn,
    quantity: line.quantity, manufactured: line.manufactured, expiry: line.expiry, retest: line.retest,
  } : { kind: "0", material: null, shelf: null, batchNumber: "", arNumber: "", grn: "", quantity: null, manufactured: null, expiry: null, retest: null };
}

/** Adds or edits one lot. Nothing is saved until the whole list is submitted. */
export function TopUpLineDialog({ editing, lines, onSave, onClose }: {
  editing: TopUpLine | null; lines: readonly TopUpLine[]; onSave: (line: TopUpLine) => void; onClose: () => void;
}) {
  const form = useForm<TopUpLineFormValues>({ resolver: zodResolver(topUpLineFormSchema), defaultValues: startValues(editing) });
  const [kindValue, material] = useWatch({ control: form.control, name: ["kind", "material"] });
  const kind = Number(kindValue) as MaterialKind;
  const materials = useDepartmentMaterials(kind);
  const shelves = useDepartmentShelves(kind);
  // A material and shelf belong to one kind; switching kind clears both.
  const firstKind = useRef(kindValue);
  useEffect(() => {
    if (kindValue === firstKind.current) return;
    firstKind.current = kindValue;
    form.setValue("material", null); form.setValue("shelf", null); form.setValue("quantity", null);
  }, [form, kindValue]);
  const picked = materials.details(material?.value) ?? (editing && editing.material.id === material?.value ? { ...editing.material, unit: editing.unit } : null);

  const fields = useMemo((): WizardField<TopUpLineFormValues>[] => [
    { type: InputTypes.RADIO, name: "kind", label: "Material kind", options: kinds, required: true, className: "md:col-span-2" },
    { type: InputTypes.SELECT, name: "material", label: "Material", mode: "single", source: "async", loadOptions: materials.loadOptions, required: true,
      placeholder: `Select a ${materialKindLabels[kind].toLowerCase()} material`, searchPlaceholder: "Search by name or code", className: "md:col-span-2",
      description: "Only materials linked to your department are listed." },
    { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number", required: true, description: "As printed on the supplier label." },
    { type: InputTypes.TEXT, name: "arNumber", label: "AR number", description: "The QC analytical report number, if released." },
    { type: InputTypes.SELECT, name: "shelf", label: "Shelf", mode: "single", source: "sync", options: shelves.options, required: true,
      placeholder: shelves.loading ? "Loading shelves…" : "Select the shelf", searchPlaceholder: "Search shelves", className: "md:col-span-2" },
    { type: InputTypes.DATE, name: "manufactured", label: "Manufacturing date", maxDate: new Date() },
    { type: InputTypes.DATE, name: "expiry", label: "Expiry date", description: "Leave empty when the material does not expire." },
    { type: InputTypes.DATE, name: "retest", label: "Retest date", description: "Only if the label or certificate gives one." },
    { type: InputTypes.TEXT, name: "grn", label: "GRN / waybill reference" },
  ], [kind, materials.loadOptions, shelves.loading, shelves.options]);

  const submit = form.handleSubmit((values) => {
    if (!values.material || !values.shelf || values.quantity === null) return;
    if (!picked?.unit) { form.setError("material", { message: "This material has no unit on its department link. Set one before entering stock." }); return; }
    const line: TopUpLine = {
      key: editing?.key ?? randomId(), kind, material: { id: picked.id, code: picked.code, name: picked.name }, unit: picked.unit,
      quantity: values.quantity, shelf: { id: values.shelf.value, label: values.shelf.label }, batchNumber: values.batchNumber.trim(),
      arNumber: values.arNumber.trim(), grn: values.grn.trim(), manufactured: values.manufactured, expiry: values.expiry, retest: values.retest,
    };
    if (lines.some((other) => other.key !== line.key && sameLot(other, line))) {
      form.setError("batchNumber", { message: "This batch of this material is already in the list. Edit that line instead." }); return;
    }
    onSave(line);
  });

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>{editing ? "Edit stock line" : "Add stock line"}</DialogTitle>
        <DialogDescription>One line per material batch. The list is kept on this page until you submit it.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {shelves.error ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{shelves.error}
            <Button type="button" size="sm" variant="outline" onClick={shelves.retry}>Retry shelves</Button></p> : null}
          {picked?.unit ? <MaterialQuantityFields key={`${picked.id}-${picked.unit}`} form={form} unit={{ id: picked.id, symbol: picked.unit }} fields={quantityFields}
            description={`Stored in ${picked.unit}. You can type it in a larger unit.`} />
            : material?.value ? <p role="alert" className="text-sm text-destructive">This material has no unit on its department link, so its quantity cannot be entered.</p>
            : <p className="text-sm text-muted-foreground">Choose the material to enter its quantity.</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? "Update line" : "Add to list"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
