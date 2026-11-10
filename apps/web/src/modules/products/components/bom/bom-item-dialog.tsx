import { useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { bomAudit } from "../../hooks/use-bom";
import { materialKind, useMaterialOptions } from "../../hooks/use-material-options";
import { useMaterialUnit } from "../../hooks/use-material-unit";
import { hasMaterial, type BomLine, type MaterialFacts } from "../../lib/bom";
import { batchQuantity } from "../../lib/product-detail";
import { bomItemFormSchema, type BomItemFormValues } from "../../schemas/bom-schema";
import { MaterialQuantityFields, type MaterialQuantityField } from "../material-quantity-fields";
import { massVolumeConversion } from "../../lib/density-conversion";

const quantityFields: readonly MaterialQuantityField<BomItemFormValues>[] = [
  { name: "baseQuantity", label: "Unit quantity", required: true, description: "Quantity in one composition unit of the product." },
];

export function BomItemDialog({ editing, lines, compositionSize, batchSize, onSubmit, onClose }: {
  editing: BomLine | null;
  lines: readonly BomLine[];
  compositionSize: number | null;
  batchSize: number | null;
  onSubmit: (values: BomItemFormValues, facts: MaterialFacts) => void;
  onClose: () => void;
}) {
  const materials = useMaterialOptions(materialKind.raw, bomAudit);
  const materialFacts = materials.facts;
  const lookupMaterialFacts = materials.lookupFacts;
  const form = useForm<BomItemFormValues>({ resolver: zodResolver(bomItemFormSchema), defaultValues: editing
    ? { material: editing.material, baseQuantity: editing.baseQuantity, useDensityConversion: editing.useDensityConversion, grade: editing.grade, substitutes: editing.substitutes }
    : { useDensityConversion: false, grade: "", substitutes: [] } });
  const [material, quantity, useDensityConversion] = useWatch({ control: form.control, name: ["material", "baseQuantity", "useDensityConversion"] });
  useEffect(() => {
    if (editing && !materialFacts(editing.material.value)) void lookupMaterialFacts(editing.material.value, editing.code);
  }, [editing, materialFacts, lookupMaterialFacts]);
  // The chosen material's details: looked up from the picker, or kept from the line being edited.
  const facts: MaterialFacts | null = materialFacts(material?.value)
    ?? (editing && editing.material.value === material?.value ? { code: editing.code, category: editing.category, specification: editing.specification, unit: editing.linkedUnit ?? editing.unit, density: editing.density } : null);
  const knownUnit = editing?.material.value === material?.value ? null : materialFacts(material?.value)?.unit ?? null;
  const linked = useMaterialUnit(material?.value, knownUnit, bomAudit);
  const used = useMemo(() => lines.filter((line) => line.key !== editing?.key).map((line) => line.material.value), [lines, editing]);
  const chosen = material?.value;
  const previousConversion = useRef(useDensityConversion === true);
  useEffect(() => {
    const enabled = useDensityConversion === true;
    if (previousConversion.current !== enabled) form.setValue("baseQuantity", Number.NaN, { shouldDirty: true, shouldValidate: true });
    previousConversion.current = enabled;
  }, [form, useDensityConversion]);
  // Stable loaders: the pickers reload their options whenever the loader they are given changes.
  const makeLoader = materials.loader;
  const loadMaterials = useMemo(() => makeLoader(used), [makeLoader, used]);
  const loadSubstitutes = useMemo(() => makeLoader(chosen ? [chosen] : []), [makeLoader, chosen]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "material", label: "Material", mode: "single", source: "async", loadOptions: loadMaterials, required: true,
      placeholder: "Select a raw material", searchPlaceholder: "Search by name or code", className: "md:col-span-2" },
    { type: InputTypes.SWITCH, name: "useDensityConversion", label: "Convert BOM mg to stock volume using density", className: "md:col-span-2",
      description: "Use the measured department density to convert the BOM amount from mg into the linked stock unit." },
    { type: InputTypes.TEXT, name: "grade", label: "Grade", placeholder: "For example BP, USP" },
    { type: InputTypes.SELECT, name: "substitutes", label: "Substitute materials", mode: "multiple", source: "async",
      loadOptions: loadSubstitutes, placeholder: "None", searchPlaceholder: "Search by name or code", className: "md:col-span-2",
      description: "Materials that may be used instead of this one." },
  ] as const satisfies readonly WizardField<BomItemFormValues>[], [loadMaterials, loadSubstitutes]);

  const submit = form.handleSubmit((values) => {
    if (hasMaterial(lines, values.material.value, editing?.key ?? null)) { form.setError("material", { message: "This material is already in the formula" }); return; }
    if (!facts || !linked.unit) { form.setError("material", { message: "Set a unit on the department material linkage before entering quantities." }); return; }
    if (values.useDensityConversion && !(facts.density > 0)) {
      form.setError("useDensityConversion", { message: "Set a positive measured density in g/mL on the department material link first." });
      return;
    }
    onSubmit(values, { ...facts, unit: linked.unit });
  });
  const sourceUnit = useDensityConversion ? { id: "mg", symbol: "mg" } : linked.unit;
  const perBatchQuantity = batchQuantity(typeof quantity === "number" && Number.isFinite(quantity) ? quantity : null, compositionSize, batchSize);
  const perBatch = sourceUnit ? toLargestUnit(perBatchQuantity, sourceUnit.symbol, "calculated") : null;
  const convertedPerBatch = useDensityConversion && linked.unit && facts && perBatchQuantity !== null && facts.density > 0
    ? massVolumeConversion(perBatchQuantity, "mg", linked.unit.symbol, facts.density) : null;

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit material" : "Add material"}</DialogTitle>
        <DialogDescription>Changes are kept on this page until you save the bill of materials.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {linked.unit ? <MaterialQuantityFields key={`${material?.value}-${sourceUnit?.symbol}`} form={form} unit={sourceUnit ?? linked.unit} fields={quantityFields} />
            : linked.status === "loading" ? <Skeleton className="h-14" />
            : material?.value ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              {linked.status === "error" ? "The material unit could not be loaded." : "No unit is set on the department material linkage."}
              <Button type="button" size="sm" variant="outline" onClick={linked.retry}>Retry unit</Button>
            </p> : null}
          {facts ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">Stock unit</dt><dd>{linked.unit?.symbol ?? "–"}</dd>
            {useDensityConversion ? <><dt className="text-muted-foreground">Density</dt><dd>{facts.density > 0 ? `${facts.density} g/mL` : "Set on the department material link"}</dd></> : null}
            <dt className="text-muted-foreground">Function</dt><dd className="break-words">{facts.category || "–"}</dd>
            <dt className="text-muted-foreground">Specification</dt><dd className="break-words">{facts.specification || "–"}</dd>
            <dt className="text-muted-foreground">Per full batch</dt><dd>{perBatch?.text ?? "–"}{useDensityConversion && convertedPerBatch !== null && linked.unit ? ` → ${toLargestUnit(convertedPerBatch, linked.unit.symbol, "calculated")?.text ?? convertedPerBatch} ${linked.unit.symbol}` : ""}</dd>
          </dl> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={Boolean(material?.value) && linked.status !== "ready"}>{editing ? "Update material" : "Add material"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
