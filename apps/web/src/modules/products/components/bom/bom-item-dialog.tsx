import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { bomAudit } from "../../hooks/use-bom";
import { materialKind, useMaterialOptions } from "../../hooks/use-material-options";
import { hasMaterial, type BomLine, type MaterialFacts } from "../../lib/bom";
import { batchQuantity } from "../../lib/product-detail";
import { bomItemFormSchema, type BomItemFormValues } from "../../schemas/bom-schema";

export function BomItemDialog({ editing, lines, compositionSize, batchSize, onSubmit, onClose }: {
  editing: BomLine | null;
  lines: readonly BomLine[];
  compositionSize: number | null;
  batchSize: number | null;
  onSubmit: (values: BomItemFormValues, facts: MaterialFacts) => void;
  onClose: () => void;
}) {
  const materials = useMaterialOptions(materialKind.raw, bomAudit);
  const form = useForm<BomItemFormValues>({ resolver: zodResolver(bomItemFormSchema), defaultValues: editing
    ? { material: editing.material, baseQuantity: editing.baseQuantity, grade: editing.grade, substitutes: editing.substitutes }
    : { grade: "", substitutes: [] } });
  const [material, quantity] = useWatch({ control: form.control, name: ["material", "baseQuantity"] });
  // The chosen material's details: looked up from the picker, or kept from the line being edited.
  const facts: MaterialFacts | null = materials.facts(material?.value)
    ?? (editing && editing.material.value === material?.value ? { code: editing.code, category: editing.category, specification: editing.specification, unit: editing.unit } : null);
  const used = useMemo(() => lines.filter((line) => line.key !== editing?.key).map((line) => line.material.value), [lines, editing]);
  const chosen = material?.value;
  // Stable loaders: the pickers reload their options whenever the loader they are given changes.
  const makeLoader = materials.loader;
  const loadMaterials = useMemo(() => makeLoader(used), [makeLoader, used]);
  const loadSubstitutes = useMemo(() => makeLoader(chosen ? [chosen] : []), [makeLoader, chosen]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "material", label: "Material", mode: "single", source: "async", loadOptions: loadMaterials, required: true,
      placeholder: "Select a raw material", searchPlaceholder: "Search by name or code", className: "md:col-span-2" },
    { type: InputTypes.NUMBER, name: "baseQuantity", label: "Unit quantity", required: true, min: 0, description: "Quantity in one composition unit of the product." },
    { type: InputTypes.TEXT, name: "grade", label: "Grade", placeholder: "For example BP, USP" },
    { type: InputTypes.SELECT, name: "substitutes", label: "Substitute materials", mode: "multiple", source: "async",
      loadOptions: loadSubstitutes, placeholder: "None", searchPlaceholder: "Search by name or code", className: "md:col-span-2",
      description: "Materials that may be used instead of this one." },
  ] as const satisfies readonly WizardField<BomItemFormValues>[], [loadMaterials, loadSubstitutes]);

  const submit = form.handleSubmit((values) => {
    if (hasMaterial(lines, values.material.value, editing?.key ?? null)) { form.setError("material", { message: "This material is already in the formula" }); return; }
    if (!facts?.unit.id) { form.setError("material", { message: "This material has no unit of measure. Set one on the material first." }); return; }
    onSubmit(values, facts);
  });
  const perBatch = toLargestUnit(batchQuantity(typeof quantity === "number" ? quantity : null, compositionSize, batchSize), facts?.unit.symbol, "calculated");

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit material" : "Add material"}</DialogTitle>
        <DialogDescription>Changes are kept on this page until you save the bill of materials.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {facts ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">Unit</dt><dd>{facts.unit.symbol || "Not set"}</dd>
            <dt className="text-muted-foreground">Function</dt><dd className="break-words">{facts.category || "–"}</dd>
            <dt className="text-muted-foreground">Specification</dt><dd className="break-words">{facts.specification || "–"}</dd>
            <dt className="text-muted-foreground">Per full batch</dt><dd>{perBatch?.text ?? "–"}</dd>
          </dl> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editing ? "Update material" : "Add material"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
