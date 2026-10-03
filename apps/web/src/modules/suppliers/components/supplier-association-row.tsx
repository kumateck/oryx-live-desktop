import { useEffect, useMemo, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { procurementApi } from "@/shared/api/generated/procurement";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKind, materialKinds } from "@/shared/reference-data/material-kinds";
import { useMaterialOptions } from "@/shared/reference-data/use-material-options";
import type { SupplierFormValues } from "../schemas/supplier-form-schema";

const { useGetApiV1ProcurementManufacturerMaterialByMaterialIdQuery } = procurementApi;

export function SupplierAssociationRow({ form, index, units, onRemove }: {
  form: UseFormReturn<SupplierFormValues>; index: number; units: readonly SelectOption[]; onRemove: () => void;
}) {
  const kind = useWatch({ control: form.control, name: `associations.${index}.kind` });
  const material = useWatch({ control: form.control, name: `associations.${index}.material` });
  const defaultManufacturer = useWatch({ control: form.control, name: `associations.${index}.defaultManufacturer` });
  const other = useWatch({ control: form.control, name: "associations" });
  const excluded = useMemo(() => other.flatMap((row, position) => position !== index && row.material?.value ? [row.material.value] : []), [other, index]);
  const loadMaterial = useMaterialOptions(materialKind(kind?.value), excluded);
  const manufacturers = useGetApiV1ProcurementManufacturerMaterialByMaterialIdQuery({ materialId: material?.value ?? "" }, { skip: !material?.value });
  const options = useMemo(() => (manufacturers.data ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []), [manufacturers.data]);
  const previous = useRef({ kind: kind?.value, material: material?.value });

  useEffect(() => {
    if (previous.current.kind !== kind?.value) form.setValue(`associations.${index}.material`, null, { shouldDirty: true });
    else if (previous.current.material !== material?.value) {
      form.setValue(`associations.${index}.uom`, null, { shouldDirty: true });
      form.setValue(`associations.${index}.defaultManufacturer`, null, { shouldDirty: true });
      form.setValue(`associations.${index}.otherManufacturers`, [], { shouldDirty: true });
    }
    previous.current = { kind: kind?.value, material: material?.value };
  }, [kind?.value, material?.value, form, index]);

  const prefix = `associations.${index}` as const;
  const fields = [
    { type: InputTypes.SELECT, name: `${prefix}.kind`, label: "Material kind", mode: "single", source: "sync", options: materialKinds, required: true },
    { type: InputTypes.SELECT, name: `${prefix}.material`, label: "Material", mode: "single", source: "async", loadOptions: loadMaterial, required: true, disabled: !kind, placeholder: "Search materials" },
    { type: InputTypes.SELECT, name: `${prefix}.uom`, label: "Purchase unit", mode: "single", source: "sync", options: units, required: true, disabled: !material },
    { type: InputTypes.SELECT, name: `${prefix}.defaultManufacturer`, label: "Default manufacturer", mode: "single", source: "sync", options, required: true, disabled: !material || manufacturers.isFetching },
    { type: InputTypes.SELECT, name: `${prefix}.otherManufacturers`, label: "Other manufacturers", mode: "multiple", source: "sync", options: options.filter((item) => item.value !== defaultManufacturer?.value), disabled: !material || manufacturers.isFetching },
  ] as const satisfies readonly WizardField<SupplierFormValues>[];

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium">Material {index + 1}</h3>
      <Button type="button" size="xs" variant="ghost" onClick={onRemove}>Remove</Button></div>
    <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
    {manufacturers.error ? <p role="alert" className="text-xs text-destructive">Manufacturers could not be loaded for this material.</p> : null}
    {material && units.length === 0 ? <p role="alert" className="text-xs text-destructive">No purchase units are configured. Ask a material administrator to add one.</p> : null}
  </section>;
}
