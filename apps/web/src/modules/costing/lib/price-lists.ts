import { z } from "zod";

export const priceListRoot = "/finance/costing";
export const priceListModel = "CostingPriceList";
export const priceListKeys = {
  view: "CanViewCostingPriceList", create: "CanCreateCostingPriceList", edit: "CanEditCostingPriceList",
  revise: "CanReviseCostingPriceList", submit: "CanSubmitCostingPriceList", review: "CanReviewCostingPriceList",
  return: "CanReturnCostingPriceList", approve: "CanApproveCostingPriceList", reject: "CanRejectCostingPriceList", print: "CanPrintCostingPriceList",
} as const;
export const priceListDetailPath = (id: string) => `${priceListRoot}/revisions/${encodeURIComponent(id)}`;
export const priceListAudit = { module: "Finance", subModule: "Costing" } as const;
export const divisionOptions = [{ value: "0", label: "Beta-lactam" }, { value: "1", label: "Non-beta-lactam" }] as const;
export const divisionLabel = (value: number) => value === 1 ? "Non-beta-lactam" : "Beta-lactam";
export const listStatus = { pending: 0, approved: 1, rejected: 3, draft: 4 } as const;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const number = z.number().nullish().transform((value) => value ?? null);
export const priceListSummarySchema = z.object({
  id: z.string(), division: z.union([z.literal(0), z.literal(1)]), documentNumber: z.string(), revisionNumber: z.number(),
  previousRevisionId: text, supersedesRevision: number, effectiveFrom: z.string(), revisionReason: z.string(),
  status: z.number(), stage: z.string(), reviewStatus: number, version: z.number(), lineCount: z.number(),
  preparedBy: text, createdAt: text, approvedAt: text,
});
const signatory = z.object({ name: text, designation: text, signature: text, signedAt: text }).nullish().transform((value) => value ?? null);
export const priceListDetailSchema = priceListSummarySchema.extend({ preparedBySignatory: signatory, checkedBy: signatory, approvedBy: signatory });
export const priceListLineSchema = z.object({
  id: z.string(), productId: z.string(), productPackingId: z.string(), packingStyle: z.string(), productCode: text, productName: z.string(),
  price: number, previousPrice: number, previousCurrencySymbol: text, previousPriceUoM: text, previousCurrencyId: text,
  priceUoM: text, currencyId: text, currencyName: text, currencySymbol: text,
});
export const priceListPrintSchema = z.object({ revision: priceListDetailSchema, lines: z.array(priceListLineSchema) });
export const packingOptionSchema = z.object({ productId: z.string(), productPackingId: z.string(), productCode: text,
  productName: z.string(), packingStyle: z.string() });
export type PriceListSummary = z.infer<typeof priceListSummarySchema>;
export type PriceListDetail = z.infer<typeof priceListDetailSchema>;
export type PriceListLine = z.infer<typeof priceListLineSchema>;
export type PriceListPrint = z.infer<typeof priceListPrintSchema>;
export type PriceListSignatory = z.infer<typeof signatory>;
export const editablePriceList = (list: PriceListSummary) => list.status === listStatus.draft
  || list.status === listStatus.pending && (list.reviewStatus === 0 || list.reviewStatus === 1);
export const priceListTone = (stage: string) => stage === "Current" ? "default" as const : stage === "Rejected" ? "destructive" as const
  : stage === "Superseded" ? "outline" as const : "secondary" as const;

export const priceListHeaderSchema = z.object({ documentNumber: z.string().trim().min(1, "Enter the document number"),
  revisionNumber: z.number().int().min(0), effectiveFrom: z.date({ message: "Choose an effective date" }),
  revisionReason: z.string().trim().min(1, "Explain why this revision is needed") });
export type PriceListHeaderValues = z.infer<typeof priceListHeaderSchema>;
export function dateOnly(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T00:00:00Z`;
}
export function calendarDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}
