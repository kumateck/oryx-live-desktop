import { specificationReferenceLabel } from "@/shared/questions/question-types";

const recordedReference = (value?: string | null) => {
  const reference = value?.trim();
  return reference && !["-", "–", "—"].includes(reference) ? specificationReferenceLabel(reference) : null;
};

/**
 * The references a test's questions cite (where its specification comes from: "BP 2024", "In-house"), without repeats,
 * for the certificate's Reference column: "BP 2024" or "BP 2024; In-house". "–" when none is recorded.
 */
export function testReference(fields: readonly { question?: { reference?: string | null | undefined } | null | undefined }[] | null | undefined,
  specificationReference?: string | null): string {
  const saved = recordedReference(specificationReference);
  if (saved) return saved;
  const references = (fields ?? []).flatMap((field) => {
    const reference = recordedReference(field.question?.reference);
    return reference ? [reference] : [];
  });
  return [...new Set(references)].join("; ") || "–";
}
