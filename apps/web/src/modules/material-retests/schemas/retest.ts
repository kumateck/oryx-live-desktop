import { z } from "zod";
const text = z.string().nullish();
export const retestSchema = z.object({
  id: z.string().min(1), materialBatchId: z.string().min(1), batchNumber: text,
  materialKind: z.union([z.literal(0), z.literal(1)]), origin: z.union([z.literal(0), z.literal(1)]),
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  approved: z.boolean(), scheduledFor: text, originalExpiryDate: text, proposedExpiryDate: text, reason: text,
  sampleTakenAt: text, sampleQuantity: z.number().finite().nullish(), sampledContainers: z.number().int().nullish(),
  acknowledgedAt: text, testRequestId: text, coaId: text, completedAt: text,
  events: z.array(z.object({ action: z.string(), detail: text, actorId: text, occurredAt: z.string() })),
});
export type MaterialRetest = z.infer<typeof retestSchema>;
export const retestStatuses = ["Pending approval", "Authorized", "Sample taken", "Acknowledged", "Testing", "Completed", "Rejected"] as const;
export const retestAudit = { module: "Quality Control", subModule: "QC Retests" };
export const retestPath = (id: string) => `/qc/material-retests/${encodeURIComponent(id)}`;
export const retestPermissions = { view: "CanViewMaterialRetests", detail: "CanViewMaterialRetestDetail", request: "CanRequestMaterialRetest", approve: "CanApproveMaterialRetest", reject: "CanRejectMaterialRetest", sample: "CanRecordMaterialRetestSample", acknowledge: "CanAcknowledgeMaterialRetest", link: "CanLinkMaterialRetestTestRequest" } as const;
