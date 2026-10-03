import { z } from "zod";
import type { DomainEntitiesProcurementSuppliersCreateSupplierRequest, DomainEntitiesProcurementSuppliersSupplierDto, DomainEntitiesProcurementSuppliersSupplierManufacturerDto } from "@/shared/api/generated/procurement";
import type { SelectOption } from "@/shared/forms/form-wizard-types";

const option = z.object({ value: z.string().min(1), label: z.string().min(1) });
const selected = option.nullable().superRefine((value, context) => {
  if (value === null) context.addIssue({ code: "custom", message: "Choose an option" });
});
const association = z.object({
  kind: selected, material: selected, uom: selected, defaultManufacturer: selected,
  otherManufacturers: z.array(option),
}).superRefine((row, context) => {
  const ids = row.otherManufacturers.map((item) => item.value);
  if (new Set(ids).size !== ids.length || ids.includes(row.defaultManufacturer?.value ?? ""))
    context.addIssue({ code: "custom", path: ["otherManufacturers"], message: "Choose each manufacturer once, and keep the default separate." });
});

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, "Supplier name is required").max(200),
  contactPerson: z.string().trim().min(1, "Contact person is required"),
  email: z.email("Enter a valid email address"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  address: z.string().trim().min(1, "Address is required"),
  country: selected, currency: selected,
  associations: z.array(association).min(1, "Add at least one material and manufacturer"),
}).superRefine((values, context) => {
  const ids = values.associations.map((item) => item.material?.value).filter((id) => id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["associations"], message: "A material may appear only once." });
});
export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const emptyAssociation = (): SupplierFormValues["associations"][number] =>
  ({ kind: null, material: null, uom: null, defaultManufacturer: null, otherManufacturers: [] });
export const emptySupplier = (): SupplierFormValues =>
  ({ name: "", contactPerson: "", email: "", contactNumber: "", address: "", country: null, currency: null, associations: [emptyAssociation()] });

function selectedOption(id: string | null | undefined, label: string | null | undefined): SelectOption | null {
  return id && label ? { value: id, label } : null;
}

export function supplierDefaults(data: DomainEntitiesProcurementSuppliersSupplierDto,
  associations: readonly DomainEntitiesProcurementSuppliersSupplierManufacturerDto[] = data.associatedManufacturers ?? []): SupplierFormValues {
  const grouped = new Map<string, SupplierFormValues["associations"][number]>();
  for (const item of associations) {
    const material = item.material;
    const manufacturer = selectedOption(item.manufacturer?.id, item.manufacturer?.name);
    if (!material?.id || !manufacturer) continue;
    const current: SupplierFormValues["associations"][number] = grouped.get(material.id) ?? {
      kind: material.kind === undefined ? null : { value: String(material.kind), label: material.kind === 0 ? "Raw material" : "Packaging material" },
      material: selectedOption(material.id, `${material.code ? `${material.code} · ` : ""}${material.name ?? "Material"}`),
      uom: selectedOption(item.uoM?.id, item.uoM?.symbol ?? item.uoM?.name),
      defaultManufacturer: null, otherManufacturers: [],
    };
    if (!current.uom && item.uoM?.id) current.uom = selectedOption(item.uoM.id, item.uoM.symbol ?? item.uoM.name);
    if (item.default) current.defaultManufacturer = manufacturer;
    else if (!current.otherManufacturers.some((other) => other.value === manufacturer.value)) current.otherManufacturers.push(manufacturer);
    grouped.set(material.id, current);
  }
  return {
    name: data.name ?? "", email: data.email ?? "", address: data.address ?? "",
    contactPerson: data.contactPerson ?? "", contactNumber: data.contactNumber ?? "",
    country: selectedOption(data.country?.id, data.country?.name), currency: selectedOption(data.currency?.id, data.currency?.name),
    associations: [...grouped.values()],
  };
}

export function supplierPayload(values: SupplierFormValues): DomainEntitiesProcurementSuppliersCreateSupplierRequest {
  return {
    name: values.name, email: values.email, address: values.address, contactPerson: values.contactPerson,
    contactNumber: values.contactNumber, countryId: values.country?.value ?? null, currencyId: values.currency?.value ?? null,
    type: values.country?.label.trim().toLowerCase() === "ghana" ? 1 : 0,
    associatedManufacturers: values.associations.flatMap((row) => {
      const materialId = row.material?.value;
      const uoMId = row.uom?.value;
      const manufacturerId = row.defaultManufacturer?.value;
      return materialId && uoMId && manufacturerId ? [
        { materialId, uoMId, manufacturerId, default: true },
        ...row.otherManufacturers.map((manufacturer) => ({ materialId, uoMId, manufacturerId: manufacturer.value, default: false })),
      ] : [];
    }),
  };
}
