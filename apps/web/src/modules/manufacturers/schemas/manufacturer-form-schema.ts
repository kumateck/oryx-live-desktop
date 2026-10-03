import { z } from "zod";
import type { DomainEntitiesProcurementManufacturersCreateManufacturerRequest, DomainEntitiesProcurementManufacturersManufacturerDto, DomainEntitiesProcurementManufacturersQuantityType } from "@/shared/api/generated/procurement";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";

const option = z.object({ value: z.string().min(1), label: z.string().min(1) });
const selected = option.nullable().superRefine((value, context) => {
  if (value === null) context.addIssue({ code: "custom", message: "Choose an option" });
});
const material = z.object({
  kind: selected, material: selected, quantityType: selected,
  values: z.string(), min: z.number().nullable(), max: z.number().nullable(),
}).superRefine((row, context) => {
  const type = row.quantityType?.value;
  const values = parseQuantities(row.values);
  if ((type === "0" && values.length !== 1) || (type === "2" && values.length < 1) || ((type === "0" || type === "2") && !validQuantities(row.values)))
    context.addIssue({ code: "custom", path: ["values"], message: type === "0" ? "Enter one positive quantity" : "Enter positive quantities separated by commas" });
  if (type === "1" && (row.min === null || row.max === null || row.min <= 0 || row.max < row.min))
    context.addIssue({ code: "custom", path: ["min"], message: "Enter a positive minimum and a maximum at least as large" });
});
export const manufacturerFormSchema = z.object({
  name: z.string().trim().min(1, "Manufacturer name is required").max(100),
  address: z.string().trim().min(1, "Address is required").max(1000),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]),
  validityDate: z.date({ error: "Select a validity date" }), country: selected,
  materials: z.array(material).min(1, "Add at least one material"),
}).superRefine((values, context) => {
  const ids = values.materials.map((row) => row.material?.value).filter((id) => id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["materials"], message: "A material may appear only once." });
});
export type ManufacturerFormValues = z.infer<typeof manufacturerFormSchema>;

export const quantityTypes = [
  { value: "0", label: "Single" }, { value: "1", label: "Range" }, { value: "2", label: "List" },
] as const;
export const emptyMaterial = (): ManufacturerFormValues["materials"][number] =>
  ({ kind: null, material: null, quantityType: quantityTypes[0], values: "", min: null, max: null });
export const emptyManufacturer = (): ManufacturerFormValues =>
  ({ name: "", address: "", email: "", validityDate: new Date(), country: null, materials: [emptyMaterial()] });

export function parseQuantities(value: string): number[] {
  return value.split(",").map((part) => Number(part.trim())).filter((number) => Number.isFinite(number) && number > 0);
}
function validQuantities(value: string): boolean {
  const parts = value.split(",").map((part) => part.trim());
  return parts.every((part) => part !== "" && Number.isFinite(Number(part)) && Number(part) > 0);
}
function quantityType(value: string | undefined): DomainEntitiesProcurementManufacturersQuantityType {
  return value === "1" ? 1 : value === "2" ? 2 : 0;
}
function optionValue(id: string | null | undefined, label: string | null | undefined): SelectOption | null {
  return id && label ? { value: id, label } : null;
}
export function manufacturerDefaults(data: DomainEntitiesProcurementManufacturersManufacturerDto): ManufacturerFormValues {
  return {
    name: data.name ?? "", address: data.address ?? "", email: data.email ?? "",
    validityDate: formDate(data.validityDate) ?? new Date(),
    country: optionValue(data.country?.id, data.country?.name),
    materials: (data.materials ?? []).map((item) => ({
      kind: item.material?.kind === undefined ? null : { value: String(item.material.kind), label: item.material.kind === 0 ? "Raw material" : "Packaging material" },
      material: optionValue(item.material?.id, item.material?.name),
      quantityType: quantityTypes[item.quantityType ?? 0],
      values: (item.quantityPerPackOption?.values ?? []).join(", "),
      min: item.quantityPerPackOption?.min ?? null, max: item.quantityPerPackOption?.max ?? null,
    })),
  };
}
export function manufacturerPayload(values: ManufacturerFormValues): DomainEntitiesProcurementManufacturersCreateManufacturerRequest {
  return {
    name: values.name, address: values.address, email: values.email,
    validityDate: utcBoundary(values.validityDate), countryId: values.country?.value ?? null,
    materials: values.materials.flatMap((row) => row.material ? [{
      materialId: row.material.value, quantityType: quantityType(row.quantityType?.value),
      quantityPerPackOption: { type: quantityType(row.quantityType?.value),
        min: row.quantityType?.value === "1" ? row.min : null, max: row.quantityType?.value === "1" ? row.max : null,
        values: row.quantityType?.value === "1" ? [] : parseQuantities(row.values) },
    }] : []),
  };
}
