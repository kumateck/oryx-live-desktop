import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { procurementApi } from "@/shared/api/generated/procurement";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKind, materialKinds } from "@/shared/reference-data/material-kinds";
import { useMaterialOptions } from "@/shared/reference-data/use-material-options";
import { useMaterialPurchaseUnitsQuery } from "@/shared/reference-data/material-purchase-units";
import { purchaseUnitDisplayOptions, purchaseUnitOptions } from "@/shared/procurement/purchase-units";
import { useMaterialSelection } from "../hooks/use-material-selection";
import { supplierAudit } from "../lib/supplier-access";
import type { SupplierFormValues } from "../schemas/supplier-form-schema";

const noUnits: readonly import("@/shared/api/generated/materials").DomainEntitiesBaseUnitOfMeasureDto[] = [];
const { useGetApiV1ProcurementManufacturerMaterialByMaterialIdQuery } = procurementApi;

export function SupplierAssociationRow({ form, index, onRemove }: {
  form: UseFormReturn<SupplierFormValues>; index: number; onRemove: () => void;
}) {
  const kind = useWatch({ control: form.control, name: `associations.${index}.kind` });
  const material = useWatch({ control: form.control, name: `associations.${index}.material` });
  const selectedUnit = useWatch({ control: form.control, name: `associations.${index}.uom` });
  const pendingUnit = useWatch({ control: form.control, name: `associations.${index}.pendingUnit` });
  const defaultManufacturer = useWatch({ control: form.control, name: `associations.${index}.defaultManufacturer` });
  const other = useWatch({ control: form.control, name: "associations" });
  const excluded = useMemo(() => other.flatMap((row, position) => position !== index && row.material?.value ? [row.material.value] : []), [other, index]);
  const loadMaterial = useMaterialOptions(materialKind(kind?.value), excluded);
  const manufacturers = useGetApiV1ProcurementManufacturerMaterialByMaterialIdQuery({ materialId: material?.value ?? "" }, { skip: !material?.value });
  const materialUnits = useMaterialPurchaseUnitsQuery({ ...supplierAudit, materialId: material?.value ?? "" }, { skip: !material?.value });
  const purchaseUnits = useMemo(() => purchaseUnitOptions(materialUnits.currentData ?? []), [materialUnits.currentData]);
  const displayedUnits = purchaseUnitDisplayOptions(purchaseUnits, selectedUnit);
  const options = useMemo(() => (manufacturers.currentData ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []), [manufacturers.currentData]);
  useMaterialSelection(form, index, kind?.value, material?.value, materialUnits.currentData ?? noUnits);

  const prefix = `associations.${index}` as const;
  const fields = [
    { type: InputTypes.SELECT, name: `${prefix}.kind`, label: "Material kind", mode: "single", source: "sync", options: materialKinds, required: true },
    { type: InputTypes.SELECT, name: `${prefix}.material`, label: "Material", mode: "single", source: "async", loadOptions: loadMaterial, required: true, disabled: !kind, placeholder: "Search materials" },
    { type: InputTypes.SELECT, name: `${prefix}.uom`, label: "Purchase unit", mode: "single", source: "sync", options: displayedUnits, required: true, disabled: !material || materialUnits.isFetching || purchaseUnits.length === 0, placeholder: materialUnits.isFetching ? "Loading units…" : "Select an option" },
    { type: InputTypes.SELECT, name: `${prefix}.defaultManufacturer`, label: "Default manufacturer", mode: "single", source: "sync", options, required: true, disabled: !material || manufacturers.isFetching },
    { type: InputTypes.SELECT, name: `${prefix}.otherManufacturers`, label: "Other manufacturers", mode: "multiple", source: "sync", options: options.filter((item) => item.value !== defaultManufacturer?.value), disabled: !material || manufacturers.isFetching },
  ] as const satisfies readonly WizardField<SupplierFormValues>[];

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium">Material {index + 1}</h3>
      <Button type="button" size="xs" variant="ghost" onClick={onRemove}>Remove</Button></div>
    {pendingUnit ? <p className="text-xs text-muted-foreground">Unit change to {pendingUnit} is awaiting pricing approval.</p> : null}
    <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
    {manufacturers.error ? <p role="alert" className="text-xs text-destructive">Manufacturers could not be loaded for this material.</p> : null}
    {material && materialUnits.error ? <p role="alert" className="text-xs text-destructive">The material’s unit could not be loaded. Check its unit linkages across departments, then retry. <Button type="button" size="xs" variant="link" onClick={() => void materialUnits.refetch()}>Retry purchase units</Button></p> : null}
    {material && !materialUnits.isFetching && !materialUnits.error && purchaseUnits.length === 0 ? <p role="alert" className="text-xs text-destructive">No compatible purchase units are available. Check the material’s unit linkages across all departments.</p> : null}
  </section>;
}
