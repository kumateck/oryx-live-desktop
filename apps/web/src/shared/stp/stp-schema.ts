import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const item = z.object({ id: z.string().nullish(), name: text, code: text }).nullish()
  .transform((value) => value?.id ? { id: value.id, name: value.name ?? "Unnamed", code: value.code } : null);
/** A material or product standard test procedure; one is kept per linked item, sharing the STP number. */
export const stpSchema = z.object({
  id: z.string(), stpNumber: text, description: text, createdAt: text,
  createdBy: z.object({ firstName: text, lastName: text }).nullish().transform((value) => value ? [value.firstName, value.lastName].filter(Boolean).join(" ") || null : null),
  attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish()
    .transform((value) => (value ?? []).map((file, index) => ({ id: file.id ?? `file-${String(index)}`, name: file.name ?? "Attachment", link: file.link }))),
  material: item, product: item,
}).transform(({ material, product, ...rest }) => ({ ...rest, number: rest.stpNumber ?? "–", item: material ?? product ?? null }));
export type Stp = z.infer<typeof stpSchema>;
export const stpRowsSchema = z.array(stpSchema);
/** The items linked to an STP number, for editing. */
export const linkedItems = (rows: readonly Stp[]) => [...new Map(rows.flatMap((row) => row.item ? [[row.item.id, { value: row.item.id, label: row.item.name }] as const] : [])).values()];
