import { z } from "zod";

export const jobRequestRoot = "/extrals/job-requests";
export const jobOrderRoot = "/extrals/job-orders";
export const jobAudit = { module: "Services", subModule: "Job Requests" } as const;
export const jobOrderAudit = { module: "Services", subModule: "Job Orders" } as const;
export const jobKeys = {
  view: "CanViewJobRequests", create: "CanCreateJobRequest", edit: "CanEditJobRequest", remove: "CanDeleteJobRequest",
  acknowledge: "CanAcknowledgeJobRequest", assign: "CanAssignJobRequest", start: "CanStartJobRequest", complete: "CanCompleteJobRequest",
  viewOrders: "CanViewJobOrders", createOrder: "CanCreateJobOrder",
} as const;

export const JobStatus = { Pending: 0, Acknowledged: 1, Assigned: 2, Started: 3, Completed: 4, SentToExternal: 5, QuotationReceived: 6, ContractorSelected: 7, Approved: 8, Cancelled: 9 } as const;
const statusNames = ["Pending", "Acknowledged", "Assigned", "Started", "Completed", "Sent to providers", "Quotation received", "Contractor selected", "Approved", "Cancelled"];
export const jobStatusLabel = (s: number) => statusNames[s] ?? `Unknown (${String(s)})`;
export const Handling = { NotAssigned: 0, Internal: 1, External: 2 } as const;
export const handlingLabel = (h: number) => h === Handling.Internal ? "In-house" : h === Handling.External ? "External provider" : "Not assigned";

const text = z.string().nullish().transform((v) => v?.trim() || null);
const person = z.object({ id: z.string().nullish(), firstName: text, lastName: text, email: text }).nullish()
  .transform((p) => p?.id ? { id: p.id, name: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "Unnamed", email: p.email } : null);
const named = z.object({ id: z.string().nullish(), name: text }).nullish().transform((n) => n?.id ? { id: n.id, name: n.name ?? "Unnamed" } : null);
export const jobRequestSchema = z.object({
  id: z.string(), code: text, createdAt: text, dateOfIssue: text, preferredCompletionDate: text, descriptionOfWork: text, status: z.number().catch(-1), handlingType: z.number().catch(0),
  equipmentInstrumentNumber: text, item: text, itemNumber: text, approved: z.boolean().catch(false), assignedAt: text,
  department: named, site: named, equipment: named, service: named, issuedBy: person, assignedBy: person, assignedToEmployee: person,
}).transform((r) => ({
  id: r.id, code: r.code ?? "Uncoded", createdAt: r.createdAt, issued: r.dateOfIssue, wantedBy: r.preferredCompletionDate, description: r.descriptionOfWork, status: r.status, handling: r.handlingType,
  equipmentNumber: r.equipmentInstrumentNumber, instrument: r.item, instrumentNumber: r.itemNumber, approved: r.approved, assignedAt: r.assignedAt,
  department: r.department, site: r.site, equipment: r.equipment, service: r.service, issuedBy: r.issuedBy, assignedBy: r.assignedBy, assignee: r.assignedToEmployee,
}));
export type JobRequest = z.infer<typeof jobRequestSchema>;
export const jobRequestPageSchema = z.object({ data: z.array(jobRequestSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });

const open = (r: JobRequest) => r.status === JobStatus.Pending || r.status === JobStatus.Acknowledged;
/** What can be done to a job request now, before permissions; mirrors the server's rules. */
export const jobActions = (r: JobRequest) => ({
  edit: open(r), remove: open(r) || r.status === JobStatus.Cancelled, cancel: open(r),
  acknowledge: r.status === JobStatus.Pending && r.approved,
  assign: open(r) && r.approved && r.handling !== Handling.External,
  order: open(r) && r.approved && r.handling !== Handling.Internal,
  reassign: r.status === JobStatus.Assigned && r.handling === Handling.Internal,
  start: r.status === JobStatus.Assigned && r.handling === Handling.Internal,
  complete: (r.status === JobStatus.Assigned || r.status === JobStatus.Started) && r.handling === Handling.Internal,
});
export const sameJob = (a: JobRequest, b: JobRequest) => a.status === b.status && a.handling === b.handling && a.approved === b.approved && (a.assignee?.id ?? null) === (b.assignee?.id ?? null);

export const OrderStatus = { Pending: 0, Sent: 1, QuotationsReceived: 2, QuotationSelected: 3, ProformaRequested: 4, ProformaReceived: 5, MemoCreated: 6, InProgress: 7, Completed: 8, Approved: 9, Cancelled: 10 } as const;
const orderNames = ["Pending", "Sent to providers", "Quotations received", "Quotation selected", "Proforma requested", "Proforma received", "Memo created", "In progress", "Completed", "Approved", "Cancelled"];
export const orderStatusLabel = (s: number) => orderNames[s] ?? `Unknown (${String(s)})`;
