import { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

export const reportRequestFailure = z.object({
  status: z.union([z.number(), z.literal("FETCH_ERROR"), z.literal("PARSING_ERROR"), z.literal("TIMEOUT_ERROR"), z.literal("CUSTOM_ERROR")]),
  data: z.json().optional(), error: z.string().optional(),
});
const historyProblem = z.object({ detail: z.string().trim().min(1), availableFrom: z.string().optional() });

export function reportFailureMessage(failure: z.infer<typeof reportRequestFailure>): string {
  if (failure.status === 409) {
    const problem = historyProblem.safeParse(failure.data);
    if (problem.success) return `${problem.data.detail}${problem.data.availableFrom ? ` Recorded history starts ${problem.data.availableFrom}.` : ""}`;
  }
  return typeof failure.status === "number" ? apiErrorMessage({ status: failure.status, data: failure.data })
    : "The report could not be loaded. Check the connection and retry.";
}
