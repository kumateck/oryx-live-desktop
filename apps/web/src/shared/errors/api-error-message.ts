import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import { z } from "zod";

// Oryx backend failures are ProblemDetails with an `errors` extension of { code, description }.
const problemSchema = z.object({
  errors: z.array(z.object({ description: z.string().trim().min(1) })).min(1),
});

export function apiErrorMessage(error: FetchBaseQueryError | SerializedError | undefined): string {
  if (!error) return "The customer server returned an invalid response.";
  if ("status" in error) {
    if (error.status === "FETCH_ERROR") return "Cannot reach the customer server. Check the connection and retry.";
    if (error.status === "PARSING_ERROR") return "The server returned a response the app could not read.";
    if (error.status === 403) return "You do not have permission for this action.";
    const problem = typeof error.status === "number" && error.status >= 400 && error.status < 500
      ? problemSchema.safeParse(error.data) : null;
    if (problem?.success) return problem.data.errors.map((item) => item.description).join(" ");
    if (error.status === 404) return "This record could not be found.";
    return `The server could not complete the request (${error.status}).`;
  }
  return error.message || "The request could not be completed.";
}

const codeSchema = z.object({ errors: z.array(z.object({ code: z.string() })).min(1) });
/** The server's error code (such as "FormAssignee.NotFound"), for the few places that act on a particular failure. */
export function apiErrorCode(error: FetchBaseQueryError | SerializedError | undefined): string | null {
  if (!error || !("status" in error)) return null;
  const parsed = codeSchema.safeParse(error.data);
  return parsed.success ? parsed.data.errors[0]?.code ?? null : null;
}
