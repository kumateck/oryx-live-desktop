import { z } from "zod";
import type { TicketCategory, TicketPriority, TicketStatus } from "../lib/tickets";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const person = z.object({ id: z.string().nullish(), firstName: text, lastName: text }).nullish().transform((value) => value?.id ? { id: value.id, name: [value.firstName, value.lastName].filter(Boolean).join(" ") || "Unnamed user" } : null);
const within = <T extends number>(maximum: number) => z.number().nullish().transform((value): T => (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximum ? value : 0) as T);
const ticket = z.object({ id: z.string().nullish(), ticketNumber: text, title: text, description: text, category: within<TicketCategory>(4), priority: within<TicketPriority>(3), status: within<TicketStatus>(4),
  reportedBy: person, assignedTo: person, department: z.object({ name: text }).nullish(), createdAt: z.string().nullish(), dueDate: z.string().nullish(), doneAt: z.string().nullish(), closedAt: z.string().nullish(), reopenCount: z.number().nullish() });

function read(entry: z.infer<typeof ticket>) {
  if (!entry.id) return null;
  return { id: entry.id, number: entry.ticketNumber ?? "No number", title: entry.title ?? "Untitled issue", description: entry.description, category: entry.category, priority: entry.priority, status: entry.status,
    reporter: entry.reportedBy, assignee: entry.assignedTo, reporterId: entry.reportedBy?.id ?? null, assigneeId: entry.assignedTo?.id ?? null, department: entry.department?.name ?? null,
    createdAt: entry.createdAt ?? null, dueDate: entry.dueDate ?? null, doneAt: entry.doneAt ?? null, closedAt: entry.closedAt ?? null, reopened: entry.reopenCount ?? 0 };
}
/** An IT issue someone reported, and how far it has got. */
export const ticketSchema = ticket.transform(read);
export const ticketRowsSchema = z.array(ticket).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Ticket = z.infer<typeof ticketRowsSchema>[number];

export const activitySchema = z.array(z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), user: person, type: z.number().nullish(), note: text, oldStatus: z.number().nullish(), newStatus: z.number().nullish() })).nullish()
  .transform((value) => (value ?? []).map((entry, index) => ({ id: entry.id ?? `activity-${index}`, when: entry.createdAt ?? null, user: entry.user?.name ?? "Unknown user", type: entry.type ?? 1, note: entry.note,
    from: entry.oldStatus ?? null, to: entry.newStatus ?? null })));
export type TicketActivity = z.infer<typeof activitySchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);
export const reportSchema = z.object({ title: z.string().trim().min(1, "Enter a short summary of the issue").max(200, "Keep the summary under 200 characters"), category: chosen("Choose the category"), priority: chosen("Choose the priority"),
  description: z.string().trim().min(1, "Describe the issue").max(4000, "Keep the description under 4000 characters") });
export type ReportValues = z.infer<typeof reportSchema>;
export const assignSchema = z.object({ agent: chosen("Choose who will handle the ticket") });
export type AssignValues = z.infer<typeof assignSchema>;
export const reopenSchema = z.object({ reason: z.string().trim().min(1, "Say why the ticket is being reopened").max(2000, "Keep the reason under 2000 characters") });
export type ReopenValues = z.infer<typeof reopenSchema>;
export const commentSchema = z.object({ comment: z.string().trim().min(1, "Write the comment").max(4000, "Keep the comment under 4000 characters") });
export type CommentValues = z.infer<typeof commentSchema>;
