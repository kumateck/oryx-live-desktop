import { z } from "zod";
import type { FormResponseDto } from "@/shared/ard-view/dto";

export const reportedResultSchema = z.object({ key: z.string(), label: z.string(), sourceValue: z.number(), value: z.number(), displayValue: z.string(), unit: z.string(),
  minimum: z.number(), maximum: z.number(), complies: z.boolean().nullable(), nominalConcentration: z.number(), definitionHash: z.string(), converted: z.boolean() });
export type CoaReportedResult = z.infer<typeof reportedResultSchema>;
type ReportedResult = NonNullable<FormResponseDto["coaReportedResults"]>[number];

export function isAssayAverage(result: Pick<ReportedResult, "key" | "label">): boolean {
  return /^average$/i.test(result.key?.trim() ?? "") || /^average(?: content)?$/i.test(result.label?.trim() ?? "");
}

export function certificateReportedResults(results: readonly ReportedResult[]): readonly ReportedResult[] {
  if (!results.some(isAssayAverage)) return results;
  return results.filter(result => result.converted || !/^sample\s+\d+$/i.test(result.label?.trim() ?? ""));
}

export function hasCoaReporting(response: FormResponseDto): boolean {
  return Boolean(response.coaReportingError || response.coaReportedResults?.length);
}
