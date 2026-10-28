import { z } from "zod";
import { productsApi } from "@/shared/api/generated/products";
import { toLargestUnit } from "@/shared/units/quantity";
import { addTags } from "@/shared/api/add-tags";

export const equipmentPermissions = { view: "CanViewEquipment", add: "CanCreateEquipment", edit: "CanEditEquipmentDetails", remove: "CanDeleteEquipment" } as const;
export const equipmentAudit = { module: "Settings", subModule: "Equipment" } as const;
export const equipmentPath = "/settings/equipments";

const list = { type: "Equipment" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
export const equipmentApi = productsApi.enhanceEndpoints({ endpoints: { getApiV1ProductEquipment: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1ProductEquipmentByEquipmentId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, postApiV1ProductEquipment: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  putApiV1ProductEquipmentByEquipmentId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, deleteApiV1ProductEquipmentByEquipmentId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
const equipment = z.object({ id: z.string().nullish(), name: text, equipmentNumber: text, isStorage: z.boolean().nullish(), capacityQuantity: z.number().nullish(), relevanceCheck: z.boolean().nullish(), location: text, model: text, serialNumber: text, createdAt: text,
  uoM: z.object({ id: z.string().nullish(), symbol: text, name: text }).nullish(), department: z.object({ id: z.string().nullish(), name: text }).nullish(), createdBy: z.object({ firstName: text, lastName: text }).nullish() });
const read = (row: z.infer<typeof equipment>) => row.id ? [{ id: row.id, name: row.name ?? "Unnamed equipment", number: row.equipmentNumber ?? "", isStorage: row.isStorage ?? false, capacity: row.capacityQuantity ?? null, relevant: row.relevanceCheck ?? false,
  location: row.location, model: row.model, serialNumber: row.serialNumber, createdAt: row.createdAt, createdBy: [row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(" ") || null,
  unit: row.uoM?.id ? { value: row.uoM.id, label: row.uoM.symbol ?? row.uoM.name ?? "Unit" } : null, department: row.department?.id ? { value: row.department.id, label: row.department.name ?? "Unnamed department" } : null }] : [];
export const equipmentRowsSchema = z.array(equipment).nullish().transform((rows) => (rows ?? []).flatMap(read));
export const equipmentSchema = equipment.transform((row) => read(row)[0] ?? null);
export type Equipment = z.infer<typeof equipmentRowsSchema>[number];

/** The capacity with its unit, in the largest unit of its family; null when the equipment has none. */
export function capacityText(item: Pick<Equipment, "capacity" | "unit">): string | null {
  if (!item.capacity || item.capacity <= 0) return null;
  return toLargestUnit(item.capacity, item.unit?.label ?? null, "entered")?.text ?? `${item.capacity.toLocaleString()} ${item.unit?.label ?? ""}`.trim();
}

const option = z.object({ value: z.string().min(1), label: z.string() });
export const equipmentFormSchema = z.object({
  number: z.string().trim().min(1, "Enter the equipment number").max(100, "Keep the number under 100 characters"),
  name: z.string().trim().min(1, "Enter the equipment name").max(255, "Keep the name under 255 characters"),
  model: z.string().trim().max(255).nullish(), serialNumber: z.string().trim().max(255).nullish(), location: z.string().trim().max(255).nullish(),
  isStorage: z.string().min(1, "Say whether it is used for storage"), relevant: z.string().min(1, "Say whether it counts in capacity planning"),
  capacity: z.number().or(z.nan()).nullish(), unit: option.nullable(),
  department: option.nullable().refine((value): boolean => Boolean(value), "Choose the department"),
}).superRefine((values, issue) => {
  const capacity = typeof values.capacity === "number" && Number.isFinite(values.capacity) ? values.capacity : null;
  if (capacity !== null && capacity <= 0) issue.addIssue({ code: "custom", path: ["capacity"], message: "The capacity must be more than 0" });
  // Storage equipment is planned by how much it holds, so it needs a capacity and its unit.
  if (values.isStorage === "1" && capacity === null) issue.addIssue({ code: "custom", path: ["capacity"], message: "Enter the capacity of storage equipment" });
  if ((values.isStorage === "1" || capacity !== null) && !values.unit) issue.addIssue({ code: "custom", path: ["unit"], message: "Choose the unit of the capacity" });
});
export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
export const yesNo = [{ value: "1", label: "Yes" }, { value: "0", label: "No" }] as const;
export const equipmentDefaults = (item: Equipment | null): EquipmentFormValues => item
  ? { number: item.number, name: item.name, model: item.model ?? "", serialNumber: item.serialNumber ?? "", location: item.location ?? "", isStorage: item.isStorage ? "1" : "0", relevant: item.relevant ? "1" : "0", capacity: item.capacity, unit: item.unit, department: item.department }
  : { number: "", name: "", model: "", serialNumber: "", location: "", isStorage: "", relevant: "", capacity: null, unit: null, department: null };
export function equipmentBody(values: EquipmentFormValues) {
  const capacity = typeof values.capacity === "number" && Number.isFinite(values.capacity) ? values.capacity : null;
  return { name: values.name, equipmentNumber: values.number, serialNumber: values.serialNumber || null, model: values.model || null, location: values.location || null, isStorage: values.isStorage === "1", relevanceCheck: values.relevant === "1",
    ...(capacity === null ? {} : { capacityQuantity: capacity }), uoMId: values.unit?.value ?? null, ...(values.department ? { departmentId: values.department.value } : {}) };
}
