import { z } from "zod";
import type { DomainEntitiesBaseCreateItemRequest } from "@/shared/api/generated/settings";
import type { CollectionDefinition } from "../lib/collections";

export const collectionRowsSchema = z.array(z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().nullish(),
  symbol: z.string().nullish(),
  code: z.string().nullish(),
  linkedDepartmentId: z.string().nullish(),
  linkedDepartmentName: z.string().nullish(),
}));
export type CollectionRow = z.infer<typeof collectionRowsSchema>[number];

export function itemSchema(definition: CollectionDefinition, existing: readonly CollectionRow[], editingId?: string) {
  return z.object({
    name: z.string().trim().min(1, "Enter a name").max(definition.nameLimit ?? 255)
      .refine((value) => !existing.some((item) => item.id !== editingId && item.name.trim().toLocaleLowerCase() === value.toLocaleLowerCase()), "An item with this name already exists"),
    description: z.string().trim().max(definition.descriptionLimit ?? 1000),
    resourceType: z.string().trim().max(255),
    available: z.boolean(),
    dueDays: z.number().int().min(0).max(2147483647).nullable(),
  }).superRefine((value, context) => {
    if (definition.mode === "resource" && !value.resourceType) context.addIssue({ code: "custom", path: ["resourceType"], message: "Enter a resource type" });
  });
}
export interface ItemValues { name: string; description: string; resourceType: string; available: boolean; dueDays: number | null }

export function itemDefaults(row?: CollectionRow): ItemValues {
  return { name: row?.name ?? "", description: row?.description ?? "", resourceType: "", available: true, dueDays: null };
}

export function itemPayload(definition: CollectionDefinition, values: ItemValues): DomainEntitiesBaseCreateItemRequest {
  return {
    name: values.name.trim(),
    ...(definition.description ? { description: values.description.trim() } : {}),
    ...(definition.kind !== undefined ? { materialKind: definition.kind } : {}),
    ...(definition.mode === "resource" ? { type: values.resourceType.trim(), isAvailable: values.available } : {}),
    ...(definition.mode === "payment" ? { dueDays: values.dueDays } : {}),
  };
}

const text = z.string().nullish();
/** Production departments an operation can be linked to, as select options. */
export const departmentOptionsSchema = z.object({ data: z.array(z.object({ id: text, name: text })).nullish() })
  .transform((value) => (value.data ?? []).flatMap((department) => department.id ? [{ value: department.id, label: department.name?.trim() || "Unnamed department" }] : []));

export interface LinkDepartmentValues { department: { value: string; label: string } | null }
export const linkDepartmentSchema: z.ZodType<LinkDepartmentValues, LinkDepartmentValues> = z.object({
  department: z.object({ value: z.string().min(1), label: z.string() }).nullable(),
}).superRefine((value, context) => {
  if (!value.department) context.addIssue({ code: "custom", path: ["department"], message: "Choose a production department" });
});
