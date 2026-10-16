import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || "");
/** Who was given which fields of a test form. */
export const formAssigneeSchema = z.object({
  id: z.string().min(1),
  fieldAssignees: z.array(z.object({ formField: z.object({ id: z.string().nullish(), question: z.object({ label: text }).nullish() }).nullish(),
    assignee: z.object({ id: z.string().nullish(), firstName: text, lastName: text }).nullish() })).nullish(),
}).transform((value) => {
  const groups = new Map<string, { assigneeId: string; name: string; fields: string[]; fieldIds: string[] }>();
  for (const entry of value.fieldAssignees ?? []) {
    const id = entry.assignee?.id;
    if (!id) continue;
    const group = groups.get(id) ?? { assigneeId: id, name: `${entry.assignee?.firstName ?? ""} ${entry.assignee?.lastName ?? ""}`.trim() || "Unnamed analyst", fields: [], fieldIds: [] };
    group.fields.push(entry.formField?.question?.label || "Untitled field");
    if (entry.formField?.id) group.fieldIds.push(entry.formField.id);
    groups.set(id, group);
  }
  return { id: value.id, analysts: [...groups.values()] };
});
export type FormAssignees = z.infer<typeof formAssigneeSchema>;
/** The fields given to one person. */
export const assignedFieldIds = (assignees: FormAssignees | null, userId: string | null) => new Set(assignees?.analysts.find((analyst) => analyst.assigneeId === userId)?.fieldIds ?? []);
