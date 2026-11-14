import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { bomAudit } from "../../hooks/use-bom";
import { materialKind, useBomDensity, useMaterialOptions } from "../../hooks/use-material-options";
import { useMaterialUnit } from "../../hooks/use-material-unit";
import { hasMaterial, type BomLine, type BomSubstitute, type MaterialFacts } from "../../lib/bom";
import type { MaterialUnit } from "../../lib/material-unit";
import { batchQuantity } from "../../lib/product-detail";
import { bomItemFormSchema, type BomItemFormValues } from "../../schemas/bom-schema";
import { MaterialQuantityFields, type MaterialQuantityField } from "../material-quantity-fields";
import { massVolumeConversion } from "../../lib/density-conversion";
import { SubstituteQuantity } from "./substitute-quantity";

const quantityFields: readonly MaterialQuantityField<BomItemFormValues>[] = [
  { name: "baseQuantity", label: "Unit quantity", required: true, description: "Quantity in one composition unit of the product." },
];

export function BomItemDialog({ editing, lines, compositionSize, batchSize, onSubmit, onClose }: {
  editing: BomLine | null;
  lines: readonly BomLine[];
  compositionSize: number | null;
  batchSize: number | null;
  onSubmit: (values: BomItemFormValues, facts: MaterialFacts, substitutes: BomSubstitute[]) => void;
  onClose: () => void;
}) {
  const materials = useMaterialOptions(materialKind.raw, bomAudit);
  const materialFacts = materials.facts;
  const form = useForm<BomItemFormValues>({ resolver: zodResolver(bomItemFormSchema), defaultValues: editing
    ? { material: editing.material, baseQuantity: editing.baseQuantity, useDensityConversion: editing.useDensityConversion, grade: editing.grade,
      substitutes: editing.substitutes.map(({ value, label }) => ({ value, label })),
      substituteQuantities: Object.fromEntries(editing.substitutes.flatMap((item) => item.baseQuantity === null ? [] : [[item.value, item.baseQuantity]])) }
    : { useDensityConversion: false, grade: "", substitutes: [], substituteQuantities: {} } });
  const [material, quantity, useDensityConversion, substitutes] = useWatch({ control: form.control, name: ["material", "baseQuantity", "useDensityConversion", "substitutes"] });
  // Each substitute's stock unit, reported by its quantity row once the department linkage is read.
  const [substituteUnits, setSubstituteUnits] = useState<Readonly<Record<string, MaterialUnit | null>>>({});
  const onSubstituteUnit = useCallback((id: string, unit: MaterialUnit | null) =>
    setSubstituteUnits((current) => current[id]?.id === unit?.id && current[id]?.symbol === unit?.symbol ? current : { ...current, [id]: unit }), []);
  const savedUnit = (id: string) => editing?.substitutes.find((item) => item.value === id)?.unit ?? null;
  // The chosen material's details: looked up from the picker, or kept from the line being edited.
  const facts: MaterialFacts | null = materialFacts(material?.value)
    ?? (editing && editing.material.value === material?.value ? { code: editing.code, category: editing.category, specification: editing.specification, unit: editing.linkedUnit ?? editing.unit } : null);
  const density = useBomDensity(useDensityConversion ? material?.value : undefined, facts?.code || material?.label || "", bomAudit);
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
      description: "Materials that may be used instead of this one. The store issues either this material or one substitute, never both." },
  ] as const satisfies readonly WizardField<BomItemFormValues>[], [loadMaterials, loadSubstitutes]);

  const submit = form.handleSubmit((values) => {
    if (hasMaterial(lines, values.material.value, editing?.key ?? null)) { form.setError("material", { message: "This material is already in the formula" }); return; }
    if (!facts || !linked.unit) { form.setError("material", { message: "Set a unit on the department material linkage before entering quantities." }); return; }
    if (values.useDensityConversion && (density.loading || density.failed)) return;
    if (values.useDensityConversion && (density.density === null
      || massVolumeConversion(1, "mg", linked.unit.symbol, density.density) === null)) {
      form.setError("useDensityConversion", { message: "Set a positive measured density with an active g/mL unit and a liquid stock unit on the department material link." });
      return;
    }
    const chosen = values.substitutes ?? [];
    const missingUnit = values.useDensityConversion ? [] : chosen.filter((item) => !substituteUnits[item.value]);
    if (missingUnit.length) { form.setError("substitutes", { message: `Set a unit on the department material linkage of: ${missingUnit.map((item) => item.label).join(", ")}.` }); return; }
    onSubmit(values, { ...facts, unit: linked.unit }, chosen.map((item) => ({ value: item.value, label: item.label,
      baseQuantity: values.substituteQuantities?.[item.value] ?? null,
      unit: values.useDensityConversion ? { id: "", symbol: "mg" } : substituteUnits[item.value] ?? null })));
  });
  const sourceUnit = useDensityConversion ? { id: "mg", symbol: "mg" } : linked.unit;
  const perBatchQuantity = batchQuantity(typeof quantity === "number" && Number.isFinite(quantity) ? quantity : null, compositionSize, batchSize);
  const perBatch = sourceUnit ? toLargestUnit(perBatchQuantity, sourceUnit.symbol, "calculated") : null;
  const convertedPerBatch = useDensityConversion && linked.unit && !density.loading && !density.failed && perBatchQuantity !== null && density.density !== null
    ? massVolumeConversion(perBatchQuantity, "mg", linked.unit.symbol, density.density) : null;

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
          {(substitutes ?? []).length ? <section aria-label="Substitute quantities" className="space-y-2">
            <h3 className="text-sm font-semibold">Substitute quantities</h3>
            <p className="text-xs text-muted-foreground">A substitute can differ in strength or water content, so enter how much of each replaces this material.</p>
            {(substitutes ?? []).map((item) => <SubstituteQuantity key={`${item.value}-${useDensityConversion ? "mg" : "stock"}`} form={form} substitute={item}
              known={useDensityConversion ? null : savedUnit(item.value)} density={useDensityConversion === true}
              compositionSize={compositionSize} batchSize={batchSize} onUnit={onSubstituteUnit} />)}
          </section> : null}
          {useDensityConversion && density.failed ? <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            The material density could not be loaded.
            <Button type="button" size="sm" variant="outline" onClick={() => { void density.retry(); }}>Retry density</Button>
          </p> : null}
          {facts ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">Stock unit</dt><dd>{linked.unit?.symbol ?? "–"}</dd>
            {useDensityConversion ? <><dt className="text-muted-foreground">Density</dt><dd>{density.loading ? "Loading…" : density.failed ? "Unavailable" : density.density && density.density > 0 ? `${density.density} g/mL` : "Set on the department material link"}</dd></> : null}
            <dt className="text-muted-foreground">Function</dt><dd className="break-words">{facts.category || "–"}</dd>
            <dt className="text-muted-foreground">Specification</dt><dd className="break-words">{facts.specification || "–"}</dd>
            <dt className="text-muted-foreground">Per full batch</dt><dd>{perBatch?.text ?? "–"}{useDensityConversion && convertedPerBatch !== null && linked.unit ? ` → ${toLargestUnit(convertedPerBatch, linked.unit.symbol, "calculated")?.text ?? `${convertedPerBatch} ${linked.unit.symbol}`}` : ""}</dd>
          </dl> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={Boolean(material?.value) && (linked.status !== "ready" || (useDensityConversion && (density.loading || density.failed)))}>{editing ? "Update material" : "Add material"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
