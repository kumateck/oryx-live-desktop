import { useEffect, useMemo, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKind, materialKinds } from "@/shared/reference-data/material-kinds";
import { useMaterialOptions } from "@/shared/reference-data/use-material-options";
import { quantityTypes, type ManufacturerFormValues } from "../schemas/manufacturer-form-schema";

export function ManufacturerMaterialRow({ form, index, onRemove }: { form: UseFormReturn<ManufacturerFormValues>; index: number; onRemove: () => void }) {
  const kind = useWatch({ control: form.control, name: `materials.${index}.kind` });
  const material = useWatch({ control: form.control, name: `materials.${index}.material` });
  const quantity = useWatch({ control: form.control, name: `materials.${index}.quantityType` });
  const rows = useWatch({ control: form.control, name: "materials" });
  const excluded = useMemo(() => rows.flatMap((row, position) => position !== index && row.material?.value ? [row.material.value] : []), [rows, index]);
  const loadMaterial = useMaterialOptions(materialKind(kind?.value), excluded);
  const priorKind = useRef(kind?.value);
  useEffect(() => {
    if (priorKind.current !== kind?.value) form.setValue(`materials.${index}.material`, null, { shouldDirty: true });
    priorKind.current = kind?.value;
  }, [kind?.value, form, index]);
  const prefix = `materials.${index}` as const;
  const fields = [
    { type: InputTypes.SELECT, name: `${prefix}.kind`, label: "Material kind", mode: "single", source: "sync", options: materialKinds, required: true },
    { type: InputTypes.SELECT, name: `${prefix}.material`, label: "Material", mode: "single", source: "async", loadOptions: loadMaterial, required: true, disabled: !kind },
    { type: InputTypes.SELECT, name: `${prefix}.quantityType`, label: "Quantity per pack", mode: "single", source: "sync", options: quantityTypes, required: true },
    ...(quantity?.value === "1" ? [
      { type: InputTypes.NUMBER, name: `${prefix}.min`, label: "Minimum", required: true, min: 0, step: 0.0001 },
      { type: InputTypes.NUMBER, name: `${prefix}.max`, label: "Maximum", required: true, min: 0, step: 0.0001 },
    ] as const : [
      { type: InputTypes.TEXT, name: `${prefix}.values`, label: quantity?.value === "2" ? "Quantities (comma separated)" : "Quantity", required: true, placeholder: quantity?.value === "2" ? "10, 20, 30" : "10" },
    ] as const),
  ] as const satisfies readonly WizardField<ManufacturerFormValues>[];
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium">Material {index + 1}</h3>
      <Button type="button" size="xs" variant="ghost" onClick={onRemove}>Remove</Button></div>
    <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
  </section>;
}
