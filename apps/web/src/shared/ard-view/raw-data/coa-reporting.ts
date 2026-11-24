import { z } from "zod";
import type { FormResponseDto } from "@/shared/ard-view/dto";

export const reportedResultSchema = z.object({ key: z.string(), label: z.string(), sourceValue: z.number(), value: z.number(), displayValue: z.string(), unit: z.string(),
  minimum: z.number(), maximum: z.number(), complies: z.boolean().nullable(), nominalConcentration: z.number(), definitionHash: z.string(), converted: z.boolean() });
export type CoaReportedResult = z.infer<typeof reportedResultSchema>;


export function hasCoaReporting(response: FormResponseDto): boolean {
  return Boolean(response.coaReportingError || response.coaReportedResults?.length);
}
