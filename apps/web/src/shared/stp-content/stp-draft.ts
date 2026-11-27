import type { DomainEntitiesStpRevisionsSaveStpRevisionDraftRequest as DraftRequest } from "@/shared/api/generated/analytical";
import { randomId } from "@/shared/ids/random-id";
import { requiredSections, sectionKinds, type ImportProposal, type RevisionDetail, type SectionKindValue, type StepKindValue } from "./stp-content";

type ContentRequest = Omit<DraftRequest, "version">;

/** A step, conditions block or note being edited. `key` is local; the server numbers nothing. */
export interface DraftStep { key: string; kind: StepKindValue; number: string; heading: string; text: string; referenceCode: string }
/** A test being edited. `testKey` is the stable key: kept for an existing test, empty for a new one. */
export interface DraftTest { key: string; testKey: string; number: string; title: string; steps: DraftStep[] }
export interface DraftContent {
  revisionNumber: string; supersedesRevision: string; reasonForChange: string;
  title: string; area: string; reference: string; effectiveDate: string; reviewDate: string; issueDate: string;
  source: string | null;
  sections: Record<SectionKindValue, string>;
  tests: DraftTest[];
}

const emptySections = (): Record<SectionKindValue, string> => ({ 0: "", 1: "", 2: "", 3: "", 4: "", 5: "" });
const day = (value: string | null) => value ? value.slice(0, 10) : "";

export function blankContent(): DraftContent {
  return { revisionNumber: "", supersedesRevision: "", reasonForChange: "", title: "", area: "Quality Control", reference: "",
    effectiveDate: "", reviewDate: "", issueDate: "", source: null, sections: emptySections(), tests: [] };
}

export const blankStep = (kind: StepKindValue = 0): DraftStep => ({ key: randomId(), kind, number: "", heading: "", text: "", referenceCode: "" });
export const blankTest = (): DraftTest => ({ key: randomId(), testKey: "", number: "", title: "", steps: [blankStep()] });

export function contentFromRevision(revision: RevisionDetail): DraftContent {
  const sections = emptySections();
  for (const section of revision.sections) sections[section.kind] = section.text ?? "";
  return {
    revisionNumber: String(revision.revisionNumber), supersedesRevision: revision.supersedesRevision === null ? "" : String(revision.supersedesRevision),
    reasonForChange: revision.reasonForChange ?? "", title: revision.title ?? "", area: revision.area ?? "", reference: revision.reference ?? "",
    effectiveDate: day(revision.effectiveDate), reviewDate: day(revision.reviewDate), issueDate: day(revision.issueDate), source: revision.source,
    sections,
    tests: revision.tests.map((test) => ({
      key: test.id, testKey: test.testKey, number: test.number ?? "", title: test.title,
      steps: test.steps.map((step) => ({ key: step.id, kind: step.kind, number: step.number ?? "", heading: step.heading ?? "", text: step.text ?? "", referenceCode: step.referenceCode ?? "" })),
    })),
  };
}

/** A proposal as editable content. Dates the header printed blank stay blank; numbers keep only their digits. */
export function contentFromProposal(proposal: ImportProposal): DraftContent {
  const sections = emptySections();
  for (const section of proposal.sections) sections[section.kind] = section.text ?? "";
  const digits = (value: string | null) => value && /^\d+$/.test(value) ? String(Number(value)) : "";
  return {
    revisionNumber: digits(proposal.revisionNumber.value), supersedesRevision: digits(proposal.supersedesRevision.value), reasonForChange: "",
    title: proposal.title.value ?? "", area: proposal.area.value ?? "", reference: proposal.reference.value ?? "",
    effectiveDate: "", reviewDate: "", issueDate: "", source: proposal.source, sections,
    tests: proposal.tests.map((test) => ({
      key: randomId(), testKey: test.testKey ?? "", number: test.number ?? "", title: test.title ?? "",
      steps: test.steps.map((step) => ({ key: randomId(), kind: step.kind, number: step.number ?? "", heading: step.heading ?? "", text: step.text ?? "", referenceCode: step.referenceCode ?? "" })),
    })),
  };
}

const orNull = (value: string) => value.trim() || null;

/** The request body every save shares. Blank sections and blank steps are left out; the server checks again. */
export function contentRequest(content: DraftContent): ContentRequest {
  return {
    revisionNumber: Number(content.revisionNumber),
    supersedesRevision: content.supersedesRevision.trim() ? Number(content.supersedesRevision) : null,
    reasonForChange: orNull(content.reasonForChange), title: orNull(content.title), area: orNull(content.area), reference: orNull(content.reference),
    effectiveDate: orNull(content.effectiveDate), reviewDate: orNull(content.reviewDate), issueDate: orNull(content.issueDate), source: content.source,
    sections: sectionKinds.filter((kind) => content.sections[kind].trim()).map((kind) => ({ kind, text: content.sections[kind].trim() })),
    tests: content.tests.map((test) => ({
      testKey: orNull(test.testKey), number: orNull(test.number), title: orNull(test.title),
      steps: test.steps.filter((step) => step.text.trim() || step.heading.trim()).map((step) => ({
        kind: step.kind, number: orNull(step.number), heading: orNull(step.heading), text: orNull(step.text), referenceCode: orNull(step.referenceCode),
      })),
    })),
  };
}

/** What stops the content being saved, or null. `complete` adds what submission needs. */
export function contentProblem(content: DraftContent, complete: boolean): string | null {
  const revision = Number(content.revisionNumber);
  if (!content.revisionNumber.trim() || !Number.isInteger(revision) || revision < 0) return "Enter the revision number.";
  if (content.supersedesRevision.trim()) {
    const supersedes = Number(content.supersedesRevision);
    if (!Number.isInteger(supersedes) || supersedes < 0) return "Supersedes must be a revision number.";
    if (supersedes >= revision) return "The revision number must be higher than the revision it supersedes.";
  }
  const untitled = content.tests.findIndex((test) => !test.title.trim());
  if (untitled >= 0) return `Test ${String(untitled + 1)} needs a title.`;
  if (!complete) return null;
  if (!content.title.trim()) return "Enter the STP title.";
  const missing = requiredSections.find((kind) => !content.sections[kind].trim());
  if (missing !== undefined) return "Sections 1.0 to 4.0 must all be filled in.";
  if (content.tests.length === 0) return "Add at least one test.";
  const empty = content.tests.find((test) => !test.steps.some((step) => step.text.trim() || step.heading.trim()));
  return empty ? `Test ${empty.number || empty.title} has no steps.` : null;
}

export function moveItem<T>(items: readonly T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(target, 0, item);
  return next;
}
