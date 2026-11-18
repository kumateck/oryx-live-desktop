import { z } from "zod";
const text = z.string().nullish();
export const retestSchema = z.object({
  id: z.string().min(1), materialBatchId: z.string().min(1), batchNumber: text,
  materialKind: z.union([z.literal(0), z.literal(1)]), origin: z.union([z.literal(0), z.literal(1)]),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)]),
  approved: z.boolean(), scheduledFor: text, originalExpiryDate: text, proposedExpiryDate: text, reason: text,
  sampleTakenAt: text, sampleQuantity: z.number().finite().nullish(), sampledContainers: z.number().int().nullish(),
  acknowledgedAt: text, testRequestId: text, coaId: text, completedAt: text,
  arNumber: text, materialSamplingId: text, materialName: text, materialCode: text,
  events: z.array(z.object({ action: z.string(), detail: text, actorId: text, occurredAt: z.string() })),
});
export type MaterialRetest = z.infer<typeof retestSchema>;
/** The retest's own progress, by the server's numbers, like an analytical test request's. */
export const RetestStatus = { PendingApproval: 0, AwaitingSample: 1, Sampled: 2, Acknowledged: 3, Testing: 4, Released: 5, Rejected: 6, Assigned: 7, TestTaken: 8, Checked: 9 } as const;
export const retestStatuses = ["Pending approval", "Awaiting sample", "Sample taken", "Acknowledged", "Testing", "Released", "Rejected", "Assigned", "Results taken", "Checked"] as const;
/** Results were submitted: the worksheet prints filled. */
export const resultsSubmitted = (status: number) => status === RetestStatus.TestTaken || status === RetestStatus.Checked || status === RetestStatus.Released || status === RetestStatus.Rejected;
export const retestAudit = { module: "Quality Control", subModule: "QC Retests" };
export const retestPath = (id: string) => `/qc/material-retests/${encodeURIComponent(id)}`;
export const retestPermissions = { view: "CanViewMaterialRetests", detail: "CanViewMaterialRetestDetail", request: "CanRequestMaterialRetest", approve: "CanApproveMaterialRetest", reject: "CanRejectMaterialRetest", sample: "CanRecordMaterialRetestSample", acknowledge: "CanAcknowledgeMaterialRetest" } as const;
export const retestTestPath = (id: string, step: "assign" | "reassign" | "test" | "progress" | "results") => `${retestPath(id)}/${step}`;
