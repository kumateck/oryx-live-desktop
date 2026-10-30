import { definitionSummary, patchAnswer, patchDefinition, sha256 } from "./definition.ts";
import type { Recipe } from "./recipe.ts";

export interface LoadedAnswer { id: string; formFieldId: string; createdAt: string; value: string | null }
export interface LoadedResponse {
  id: string; formId: string; checkedAt: string | null; approved: boolean; rejected: boolean; deletedAt: string | null;
  submissionSets: number; snapshots: number; governedPlacement: boolean; answers: LoadedAnswer[];
}
export interface Loaded {
  question: { id: string; label: string | null; type: number; deletedAt: string | null; governed: boolean } | null;
  options: { id: string; definition: string | null }[];
  fields: { id: string; formId: string; formName: string | null }[];
  responses: LoadedResponse[];
}
export interface AnswerChange { id: string; responseId: string; sha256: string; value: string }
export type Completeness = (raw: string, definition: string) => boolean;

export interface Plan {
  problems: string[];
  definitionBefore: string;
  definitionAfter: string;
  newSha256: string;
  answers: AnswerChange[];
  report: Record<string, unknown>;
}

const isClosed = (response: LoadedResponse) => Boolean(response.checkedAt) || response.approved || response.rejected || response.submissionSets > 0;
/** The answer the app shows: the newest saved row for each field. */
const latestPerField = (answers: readonly LoadedAnswer[]) =>
  [...new Map([...answers].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((answer) => [answer.formFieldId, answer])).values()];

export function buildPlan(loaded: Loaded, recipe: Recipe, allowClosedResponses: boolean, complete: Completeness | null): Plan {
  const problems: string[] = [];
  const question = loaded.question;
  if (!question) problems.push("Question not found");
  else {
    if (question.type !== 10) problems.push("Question is not a formula question");
    if (question.deletedAt) problems.push("Question is deleted");
    if (question.governed) problems.push("Question is under formula governance: correct it through a formula revision instead");
  }
  if (loaded.options.length !== 1) problems.push(`Expected exactly one live definition option, found ${loaded.options.length}`);
  const definitionBefore = loaded.options[0]?.definition ?? "";
  const currentSha = sha256(definitionBefore);
  if (currentSha !== recipe.expectedDefinitionSha256) problems.push(`Stored definition hash is ${currentSha}, the recipe expects ${recipe.expectedDefinitionSha256}`);

  let definitionAfter = definitionBefore;
  try { definitionAfter = patchDefinition(definitionBefore, recipe.definition); }
  catch (error) { problems.push(`Definition patch: ${error instanceof Error ? error.message : String(error)}`); }
  if (definitionAfter === definitionBefore && problems.length === 0) problems.push("The recipe does not change the definition");

  const governed = loaded.responses.filter((response) => response.governedPlacement).map((response) => response.id);
  if (governed.length > 0) problems.push(`Governed formula placements answer this question (${governed.join(", ")}); this script does not rebase them`);
  const closed = loaded.responses.filter(isClosed).map((response) => response.id);
  if (closed.length > 0 && !allowClosedResponses) problems.push(`Closed responses answered this question (${closed.join(", ")}); rerun with --allow-closed-responses only after QA agrees`);

  const answers: AnswerChange[] = [];
  for (const responseId of recipe.answers?.responseIds ?? []) {
    const response = loaded.responses.find((item) => item.id.toLowerCase() === responseId);
    if (!response) { problems.push(`Response ${responseId} has no answer to this question`); continue; }
    if (isClosed(response) || response.snapshots > 0 || response.deletedAt) { problems.push(`Response ${responseId} is not open; its answers cannot be changed here`); continue; }
    for (const answer of latestPerField(response.answers)) {
      try {
        const value = patchAnswer(answer.value ?? "", recipe.answers?.operations ?? []);
        if (value !== answer.value) answers.push({ id: answer.id, responseId: response.id, sha256: sha256(answer.value ?? ""), value });
      } catch (error) { problems.push(`Answer ${answer.id}: ${error instanceof Error ? error.message : String(error)}`); }
    }
  }

  const summary = (raw: string) => { try { return definitionSummary(raw); } catch (error) { return { unreadable: error instanceof Error ? error.message : String(error) }; } };
  const openAnswers = loaded.responses.filter((response) => !isClosed(response) && !response.deletedAt).flatMap((response) =>
    latestPerField(response.answers).map((answer) => {
      const after = answers.find((change) => change.id === answer.id)?.value ?? answer.value ?? "";
      return { responseId: response.id, answerId: answer.id, formFieldId: answer.formFieldId,
        ...(complete ? { completeBefore: complete(answer.value ?? "", definitionBefore), completeAfter: complete(after, definitionAfter) } : {}) };
    }));

  return { problems, definitionBefore, definitionAfter, newSha256: sha256(definitionAfter), answers, report: {
    recipe: recipe.name, question: question ? { id: question.id, label: question.label } : null,
    usedBy: loaded.fields, currentSha256: currentSha, newSha256: sha256(definitionAfter),
    before: summary(definitionBefore), after: summary(definitionAfter),
    responses: { open: loaded.responses.length - closed.length, closed },
    openAnswers, answerChanges: answers.map(({ id, responseId }) => ({ id, responseId })),
    ...(complete ? {} : { completenessCheck: "Not run: install dependencies (bun install) to compare against the app's own check" }),
  } };
}
