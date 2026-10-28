import { z } from "zod";
const text = z.string().nullish().transform((value) => value ?? "");
const person = z.object({ id: text, firstName: text, lastName: text }).nullish();
export const investigationSchema = z.object({
  id: z.string().min(1), materialBatchId: z.string().nullish(), analyticalTestRequestId: z.string().nullish(),
  coaNumber: text, productOrMaterialName: text, batchNumber: text, rejectionReason: text,
  rootCauseAnalysis: text, correctiveActions: text, preventiveActions: text, investigationDetails: text,
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  createdAt: text, updatedAt: text, createdBy: person, submittedToQaAt: text, submittedBy: person,
  qaReviewedAt: text, qaReviewer: person, qaReviewComments: text,
});
export type Investigation = z.infer<typeof investigationSchema>;
const finding = z.string().trim().max(4000).refine((value) => value.replace(/<[^>]*>|&nbsp;|&#160;/g, " ").trim().length > 0, "Record the investigation finding");
export const investigationForm = z.object({
  rootCauseAnalysis: finding, correctiveActions: finding, preventiveActions: finding, investigationDetails: finding,
  comments: z.string().trim().max(2000),
});
export const investigationReviewForm = investigationForm.extend({ rootCauseAnalysis: z.string(), correctiveActions: z.string(), preventiveActions: z.string(), investigationDetails: z.string() });
export type InvestigationValues = z.infer<typeof investigationForm>;
export const investigationAudit = { module: "Quality Assurance", subModule: "OOS Investigations" };
export const investigationStatuses = ["Initiated", "Submitted to QA", "QA approved", "Permanently rejected"] as const;
