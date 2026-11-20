/**
 * The references a test's questions cite (where its specification comes from: "BP 2024", "In-house"), without repeats,
 * for the certificate's Reference column: "BP 2024" or "BP 2024; In-house". "–" when none is recorded.
 */
export function testReference(fields: readonly { question?: { reference?: string | null | undefined } | null | undefined }[] | null | undefined): string {
  const references = (fields ?? []).flatMap((field) => field.question?.reference?.trim() ? [field.question.reference.trim()] : []);
  return [...new Set(references)].join("; ") || "–";
}
