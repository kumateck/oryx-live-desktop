import { useMemo } from "react";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { detailSchema, RevisionStatus, summariesSchema, type ImportProposal } from "./stp-content";
import { contentFromProposal, contentProblem, contentRequest } from "./stp-draft";
import { stpRevisionAudit, stpRevisionKeys, type StpKind } from "./stp-keys";
import { useCreateStpRevisionMutation, useReviseStpRevisionMutation, useSaveStpRevisionDraftMutation, useStpRevisionQuery, useStpRevisionsQuery } from "./stp-revision-api";

/** What using a proposal does, from the STP number's revisions: a first draft, the open draft's content, or a new revision. */
export type ProposalTarget =
  | { kind: "create" } | { kind: "replace-draft"; draftId: string } | { kind: "revise"; currentNumber: number }
  | { kind: "blocked"; reason: string };

/** Applies a reviewed proposal to the STP number. Returns the draft's id, or the reason it failed. */
export function useApplyProposal(kind: StpKind, stpNumber: string) {
  const { has, allowsNow } = useAccess();
  const keys = stpRevisionKeys(kind);
  const revisions = useStpRevisionsQuery({ ...stpRevisionAudit, kind, stpNumber }, { skip: !stpNumber, refetchOnMountOrArgChange: true });
  const rows = useMemo(() => summariesSchema.safeParse(revisions.data ?? []).data ?? [], [revisions.data]);
  const draft = rows.find((row) => row.status === RevisionStatus.Draft) ?? null;
  const draftDetail = useStpRevisionQuery({ ...stpRevisionAudit, id: draft?.id ?? "" }, { skip: !draft, refetchOnMountOrArgChange: true });
  const [create] = useCreateStpRevisionMutation();
  const [revise] = useReviseStpRevisionMutation();
  const [saveDraft] = useSaveStpRevisionDraftMutation();
  const current = rows.find((row) => row.status === RevisionStatus.Approved) ?? null;
  const target: ProposalTarget = rows.some((row) => row.status === RevisionStatus.Pending) ? { kind: "blocked", reason: "A revision of this STP is in review. Finish or delete it first." }
    : draft ? has(keys.editDraft) ? { kind: "replace-draft", draftId: draft.id } : { kind: "blocked", reason: "You cannot edit this STP's open draft." }
    : current ? has(keys.revise) && has(keys.editDraft) ? { kind: "revise", currentNumber: current.revisionNumber } : { kind: "blocked", reason: "You cannot start a new revision of this STP." }
    : has(keys.create) ? { kind: "create" } : { kind: "blocked", reason: "You cannot start this STP's first revision." };

  const apply = async (proposal: ImportProposal): Promise<{ id: string } | { error: string }> => {
    const content = contentFromProposal(proposal);
    if (target.kind === "blocked") return { error: target.reason };
    if (target.kind === "create") {
      if (!content.revisionNumber) content.revisionNumber = "0";
      const problem = contentProblem(content, false);
      if (problem) return { error: problem };
      if (!allowsNow(keys.create)) return { error: "You no longer have permission to start this revision." };
      const result = await create({ ...stpRevisionAudit, domainEntitiesStpRevisionsCreateStpRevisionRequest: { ...contentRequest(content), kind, stpNumber } });
      return "error" in result ? { error: apiErrorMessage(result.error) } : { id: result.data };
    }
    let draftId: string;
    let version: number;
    let keep: { revisionNumber: string; supersedesRevision: string; reasonForChange: string };
    if (target.kind === "replace-draft") {
      const parsed = detailSchema.safeParse(draftDetail.data);
      if (!parsed.success) return { error: "The open draft could not be read. Reload and try again." };
      draftId = parsed.data.id; version = parsed.data.version;
      keep = { revisionNumber: String(parsed.data.revisionNumber), supersedesRevision: parsed.data.supersedesRevision === null ? "" : String(parsed.data.supersedesRevision), reasonForChange: parsed.data.reasonForChange ?? "" };
    } else {
      const proposed = Number(content.revisionNumber);
      const revisionNumber = Number.isInteger(proposed) && proposed > target.currentNumber ? proposed : target.currentNumber + 1;
      if (!allowsNow(keys.revise)) return { error: "You no longer have permission to start a revision." };
      const started = await revise({ ...stpRevisionAudit, domainEntitiesStpRevisionsReviseStpRevisionRequest: {
        kind, stpNumber, revisionNumber, reasonForChange: `Imported from ${proposal.source ?? proposal.fileName ?? "a Word STP"}` } });
      if ("error" in started) return { error: apiErrorMessage(started.error) };
      draftId = started.data; version = 0;
      keep = { revisionNumber: String(revisionNumber), supersedesRevision: String(target.currentNumber), reasonForChange: `Imported from ${proposal.source ?? proposal.fileName ?? "a Word STP"}` };
    }
    const merged = { ...content, ...keep };
    const problem = contentProblem(merged, false);
    if (problem) return { error: problem };
    if (!allowsNow(keys.editDraft)) return { error: "You no longer have permission to save the draft." };
    const saved = await saveDraft({ ...stpRevisionAudit, id: draftId, domainEntitiesStpRevisionsSaveStpRevisionDraftRequest: { ...contentRequest(merged), version } });
    return "error" in saved ? { error: apiErrorMessage(saved.error) } : { id: draftId };
  };
  return { target, loading: revisions.isLoading || draftDetail.isLoading, error: revisions.error ?? draftDetail.error ?? null, apply };
}
