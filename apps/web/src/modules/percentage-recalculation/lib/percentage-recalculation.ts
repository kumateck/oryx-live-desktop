import { z } from "zod";

export const percentageRecalculationKey = "CanRecalculatePercentageFormulaResults";
export const percentageRecalculationAudit = { module: "Quality Control", subModule: "Testing" };

const storedResult = z.object({ key: z.string(), value: z.string().nullable().optional(), unit: z.string().nullable().optional() });
const storedResults = z.array(storedResult);

export const percentageItemSchema = z.object({
  responseId: z.string(), formFieldId: z.string(), questionId: z.string(), test: z.string(),
  product: z.string().nullable().optional(), batch: z.string().nullable().optional(), arNumber: z.string().nullable().optional(),
  testStatus: z.string().nullable().optional(), currentResults: z.string(), finalized: z.boolean(), blocker: z.string().nullable().optional(),
});
export type PercentageItem = z.infer<typeof percentageItemSchema>;

export const percentageOutcomeSchema = z.object({
  responseId: z.string(), formFieldId: z.string(), recalculated: z.boolean(),
  previousResults: z.string().nullable().optional(), results: z.string().nullable().optional(), problem: z.string().nullable().optional(),
});
export type PercentageOutcome = z.infer<typeof percentageOutcomeSchema>;

/** "Sample 1 1.02 % · Sample 2 1.04 % · Average 1.03 %" from the stored results JSON; the raw text when it cannot be read. */
export function resultsText(json: string | null | undefined): string {
  if (!json) return "–";
  try {
    const parsed = storedResults.safeParse(JSON.parse(json));
    if (!parsed.success) return json;
    const label = (key: string) => key.replace(/([a-z])(\d)/gi, "$1 $2").replace(/^./, (first) => first.toUpperCase());
    return parsed.data.map((item) => `${label(item.key)} ${item.value ?? "–"}${item.unit ? ` ${item.unit}` : ""}`).join(" · ") || "–";
  } catch { return json; }
}

/** The reason the backend requires: 10–2000 characters once trimmed. */
export const reasonProblem = (reason: string) =>
  reason.trim().length < 10 ? "Enter a reason of at least 10 characters." : reason.trim().length > 2000 ? "Keep the reason to 2000 characters." : null;
