import { z } from "zod";

export const RevisionStatus = { Pending: 0, Approved: 1, Superseded: 2, Rejected: 3, Draft: 4 } as const;
const statusNames = ["Being prepared", "Current", "Superseded", "Rejected", "Draft"];
export const revisionStatusLabel = (status: number) => statusNames[status] ?? `Unknown (${String(status)})`;
export const ReviewStatus = { AwaitingReview: 0, Returned: 1, Confirmed: 2 } as const;
/** Where a revision being prepared stands: in review, returned, or (review confirmed) awaiting approval. */
export const stageLabel = (status: number, review: number | null) => status !== RevisionStatus.Pending ? revisionStatusLabel(status)
  : review === ReviewStatus.AwaitingReview ? "Awaiting check" : review === ReviewStatus.Returned ? "Returned for correction" : "Awaiting approval";
export const stageVariant = (status: number) => status === RevisionStatus.Approved ? "default" as const
  : status === RevisionStatus.Rejected ? "destructive" as const : status === RevisionStatus.Superseded ? "outline" as const : "secondary" as const;

export const SectionKind = { Purpose: 0, Scope: 1, Responsibility: 2, Accountability: 3, Reagents: 4, ProcedureNotes: 5 } as const;
export type SectionKindValue = (typeof SectionKind)[keyof typeof SectionKind];
export const sectionKinds: readonly SectionKindValue[] = [0, 1, 2, 3, 4, 5];
export const sectionLabel: Record<SectionKindValue, string> = {
  0: "1.0 Purpose", 1: "2.0 Scope", 2: "3.0 Responsibility", 3: "4.0 Accountability", 4: "Reagents", 5: "Procedure notes",
};
/** Sections 1.0 to 4.0 are required before submission. */
export const requiredSections: readonly SectionKindValue[] = [0, 1, 2, 3];
export const StepKind = { Step: 0, Conditions: 1, Note: 2 } as const;
export type StepKindValue = (typeof StepKind)[keyof typeof StepKind];
export const stepKindLabel: Record<StepKindValue, string> = { 0: "Step", 1: "Conditions", 2: "Note" };

const text = z.string().nullish().transform((value) => value?.trim() || null);
const number = z.number().nullish().transform((value) => value ?? null);
const sectionKind = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const stepKind = z.union([z.literal(0), z.literal(1), z.literal(2)]);
const kind = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const summarySchema = z.object({
  id: z.string(), kind, stpNumber: z.string(), revisionNumber: z.number(), supersedesRevision: number,
  status: z.number(), reviewStatus: number, title: text, testCount: z.number().catch(0), preparedBy: text,
  createdAt: text, approvedAt: text, supersededAt: text,
});
export type RevisionSummary = z.infer<typeof summarySchema>;
export const summariesSchema = z.array(summarySchema);
export const overviewSchema = z.array(z.object({
  stpNumber: z.string(), current: summarySchema.nullish().transform((v) => v ?? null),
  inPreparation: summarySchema.nullish().transform((v) => v ?? null), revisionCount: z.number().catch(0),
}));
export type StpNumberOverview = z.infer<typeof overviewSchema>[number];

const signatory = z.object({ name: text, designation: text, signature: text, signedAt: text }).nullish().transform((s) => s?.name ? s : null);
export type Signatory = NonNullable<z.infer<typeof signatory>>;
const stepSchema = z.object({ id: z.string(), kind: stepKind, number: text, heading: text, text, referenceCode: text });
const testSchema = z.object({ id: z.string(), testKey: z.string(), number: text, title: z.string(), steps: z.array(stepSchema).nullish().transform((v) => v ?? []) });
export const detailSchema = summarySchema.extend({
  revisedFromId: text, reasonForChange: text, area: text, reference: text, effectiveDate: text, reviewDate: text, issueDate: text,
  source: text, version: z.number().int().nonnegative(), reviewVersion: number, approvedFileSha256: text,
  preparedBySignatory: signatory, checkedBy: signatory, approvedBy: signatory,
  sections: z.array(z.object({ id: z.string(), kind: sectionKind, text })).nullish().transform((v) => v ?? []),
  tests: z.array(testSchema).nullish().transform((v) => v ?? []),
});
export type RevisionDetail = z.infer<typeof detailSchema>;
export type RevisionTest = RevisionDetail["tests"][number];

export const Confidence = { High: 0, Medium: 1, Low: 2 } as const;
const confidence = z.union([z.literal(0), z.literal(1), z.literal(2)]).catch(2);
const field = z.object({ value: text, confidence, flag: text }).nullish().transform((f) => f ?? { value: null, confidence: 2 as const, flag: "Missing from the reply." });
export type ImportField = z.infer<typeof field>;
export const proposalSchema = z.object({
  succeeded: z.boolean(), failureReason: text, fileName: text, source: text, kind,
  stpNumber: field, title: field, revisionNumber: field, supersedesRevision: field, area: field, reference: field,
  effectiveDate: field, reviewDate: field, issueDate: field,
  sections: z.array(z.object({ kind: sectionKind, text, confidence, flag: text })).nullish().transform((v) => v ?? []),
  tests: z.array(z.object({
    testKey: text, number: text, title: text, confidence, flag: text,
    steps: z.array(z.object({ kind: stepKind, number: text, heading: text, text, referenceCode: text, confidence, flag: text })).nullish().transform((v) => v ?? []),
  })).nullish().transform((v) => v ?? []),
  warnings: z.array(z.string()).nullish().transform((v) => v ?? []), flaggedCount: z.number().catch(0),
});
export type ImportProposal = z.infer<typeof proposalSchema>;

export const linksSchema = z.object({
  kind, stpNumbers: z.array(z.string()).nullish().transform((v) => v ?? []),
  tests: z.array(z.object({ formSectionId: z.string(), sectionName: text, stpNumber: text, testKey: text, testNumber: text, testTitle: text,
    revisionNumber: number, resolved: z.boolean().catch(false) })).nullish().transform((v) => v ?? []),
  options: z.array(z.object({ stpNumber: z.string(), revisionNumber: z.number(), testKey: z.string(), testNumber: text, testTitle: z.string() }))
    .nullish().transform((v) => v ?? []),
});
export type StpTestLinks = z.infer<typeof linksSchema>;
