import { z } from "zod";

// The parts of a material or product specification the desktop reads, checked at the boundary.

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const person = z.object({ firstName: text, lastName: text, department: z.object({ name: text }).nullish() }).nullish()
  .transform((value) => value ? { name: [value.firstName, value.lastName].filter(Boolean).join(" ") || null, department: value.department?.name ?? null } : null);
/** The material or product a specification row is for. */
const item = z.object({ id: z.string(), name: text, code: text, kind: z.number().nullish(), pharmacopoeia: text, genericName: text, division: z.number().nullish() }).nullish()
  .transform((value) => value ? { id: value.id, name: value.name ?? "Unnamed", code: value.code, kind: value.kind ?? null, pharmacopoeia: value.pharmacopoeia, genericName: value.genericName, division: value.division ?? null } : null);

export const specificationSchema = z.object({
  id: z.string(), specificationNumber: text, revisionNumber: text, supersedesNumber: text, reference: text, description: text,
  effectiveDate: text, reviewDate: text, dueDate: text, createdAt: text, isVerified: z.boolean().nullish().transform((value) => value === true),
  testStage: z.number().nullish().transform((value) => value ?? null),
  form: z.object({ id: z.string(), name: text }).nullish().transform((value) => value ? { id: value.id, name: value.name ?? "Unnamed template" } : null),
  createdBy: person, material: item, product: item,
}).transform(({ material, product, ...rest }) => ({ ...rest, number: rest.specificationNumber ?? "–", item: material ?? product ?? null }));
export type Specification = z.infer<typeof specificationSchema>;
export const specificationRowsSchema = z.array(specificationSchema);

/** One test (section) of the specification's template, with the reference value QC set for it. */
export const sectionSchema = z.object({ id: z.string(), name: text, description: text, value: text, groupName: text, order: z.number().nullish() })
  .transform((value) => ({ id: value.id, name: value.name ?? "", description: value.description ?? "", value: value.value, group: value.groupName, order: value.order ?? 0 }));
export type SpecificationSection = z.infer<typeof sectionSchema>;
export const sectionPageSchema = z.object({ data: z.array(sectionSchema).nullish() }).transform((value) => value.data ?? []);
export const templateSectionsSchema = z.object({ name: text, sections: z.array(sectionSchema).nullish() }).transform((value) => ({ name: value.name, sections: value.sections ?? [] }));

/** The template's tests in order, each with its saved reference value. Values are stored apart from the template and joined by test. */
export function withSavedValues(template: readonly SpecificationSection[], saved: readonly SpecificationSection[]) {
  const values = new Map(saved.map((section) => [section.id, section.value]));
  return [...template].sort((a, b) => a.order - b.order).map((section) => ({ ...section, value: values.get(section.id) ?? null }));
}

export type SectionRow = { type: "test"; section: SpecificationSection } | { type: "group"; name: string; sections: SpecificationSection[] };
/** Tests that share a group name are shown together, under the group, when there are at least two of them. */
export function groupSections(sections: readonly SpecificationSection[]): SectionRow[] {
  const counts = new Map<string, number>();
  for (const section of sections) if (section.group) counts.set(section.group, (counts.get(section.group) ?? 0) + 1);
  const groups = new Map<string, SpecificationSection[]>();
  const rows: SectionRow[] = [];
  for (const section of sections) {
    const group = section.group;
    if (!group || (counts.get(group) ?? 0) < 2) { rows.push({ type: "test", section }); continue; }
    const existing = groups.get(group);
    if (existing) { existing.push(section); continue; }
    const created = [section];
    groups.set(group, created);
    rows.push({ type: "group", name: group, sections: created });
  }
  return rows;
}
