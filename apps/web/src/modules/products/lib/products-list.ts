/** Empty scope is expected in QA until a department is selected. */
export function productListError(departmentId: string | null, mode: "production" | "qa", requestError: string | null, invalid: boolean): string | null {
  if (!departmentId) return mode === "qa" ? null : "Your account has no department, so there are no planned products to show.";
  if (requestError) return requestError;
  return invalid ? "The server returned product records the app could not read." : null;
}
