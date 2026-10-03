import { z } from "zod";
import { isSingleRoleRoute, parseWait } from "../lib/workflows";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const who = z.object({ id: z.string().nullish(), name: text }).nullish();
const workflow = z.object({ id: z.string().nullish(), itemType: text, escalationDuration: text, createdAt: z.string().nullish(), createdBy: z.object({ name: text }).nullish(),
  approvalStages: z.array(z.object({ user: who, role: who, order: z.number().nullish(), required: z.boolean().nullish() })).nullish() });

function read(entry: z.infer<typeof workflow>) {
  if (!entry.id || !entry.itemType) return null;
  const stages = [...(entry.approvalStages ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).flatMap((stage) => {
    // The server stores a stage against a user or a role, never both.
    const role = stage.role?.id ? stage.role : null;
    const person = role ? null : stage.user?.id ? stage.user : null;
    const approver = role ?? person;
    return approver?.id ? [{ kind: role ? "role" as const : "user" as const, id: approver.id, name: approver.name ?? (role ? "Unnamed role" : "Unnamed user") }] : [];
  });
  return { id: entry.id, type: entry.itemType, wait: parseWait(entry.escalationDuration), createdAt: entry.createdAt ?? null, createdBy: entry.createdBy?.name ?? null, stages };
}
/** The approvers a kind of document passes through, in order. */
export const workflowSchema = workflow.transform(read);
export const workflowRowsSchema = z.array(workflow).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Workflow = z.infer<typeof workflowRowsSchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const whole = (message: string, maximum: number) => z.number({ message }).refine((value) => Number.isInteger(value) && value >= 0 && value <= maximum, message);
const stage = z.object({ kind: z.string(), approver: option.nullable().refine((value): boolean => Boolean(value), "Choose the approver") });
export const workflowFormSchema = z.object({
  document: option.nullable().refine((value): boolean => Boolean(value), "Choose the document"),
  days: whole("Enter the days as a whole number, 0 to 365", 365), hours: whole("Enter the hours, 0 to 23", 23), minutes: whole("Enter the minutes, 0 to 59", 59),
  stages: z.array(stage).min(1, "Add at least one approver"),
}).superRefine((values, context) => {
  if (values.days + values.hours + values.minutes === 0) context.addIssue({ code: "custom", path: ["hours"], message: "Give the stage some time before it is escalated" });
  const seen = new Set<string>();
  values.stages.forEach((line, index) => { if (!line.approver) return; const key = `${line.kind}:${line.approver.value}`;
    if (seen.has(key)) context.addIssue({ code: "custom", path: ["stages", index, "approver"], message: "This approver is already in the workflow" });
    seen.add(key); });
  if (values.document && isSingleRoleRoute(values.document.value) && (values.stages.length !== 1 || values.stages[0]?.kind !== "role"))
    context.addIssue({ code: "custom", path: ["stages"], message: "This route takes exactly one approver, and it has to be a role" });
});
export type WorkflowFormValues = z.infer<typeof workflowFormSchema>;
