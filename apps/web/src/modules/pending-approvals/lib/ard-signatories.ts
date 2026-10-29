import type { ArdAnswer, ArdPerson } from "../schemas/ard-result-schema";

export interface ArdSignatories { analysts: readonly string[]; checker: string | null }
const nameOf = (person: ArdPerson) => [person?.firstName?.trim(), person?.lastName?.trim()].filter(Boolean).join(" ");

/** Attribute only this response's recorded answers, never another test in the same batch or the print operator. */
export function ardSignatories(responseId: string, embedded: readonly ArdAnswer[], batch: readonly ArdAnswer[], checkedBy: ArdPerson): ArdSignatories {
  const people = new Map<string, string>();
  const own = [...embedded.filter((answer) => !answer.responseId || answer.responseId === responseId),
    ...batch.filter((answer) => answer.responseId === responseId)];
  for (const answer of own) {
    const name = nameOf(answer.createdBy);
    if (name && (answer.value !== null || answer.complies != null || (answer.attachments?.length ?? 0) > 0)) {
      people.set(answer.createdBy?.id || name, name);
    }
  }
  return { analysts: [...people.values()], checker: nameOf(checkedBy) || null };
}
