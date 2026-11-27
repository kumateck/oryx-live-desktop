import { Badge } from "@/components/ui/badge";
import { Confidence, sectionLabel, StepKind, type ImportField, type ImportProposal } from "./stp-content";

const tone = { 0: "outline", 1: "secondary", 2: "destructive" } as const;
const word = { 0: "Read", 1: "Check", 2: "Missing" } as const;
function Mark({ confidence }: { confidence: 0 | 1 | 2 }) {
  return confidence === Confidence.High ? null : <Badge variant={tone[confidence]} className="shrink-0">{word[confidence]}</Badge>;
}
const headerFields = [["stpNumber", "STP No."], ["title", "Title"], ["revisionNumber", "Revision No."], ["supersedesRevision", "Supersedes"],
  ["area", "Area"], ["reference", "Reference"], ["effectiveDate", "Effective date"], ["reviewDate", "Review date"], ["issueDate", "Issue date"]] as const;

interface Flag { where: string; confidence: 0 | 1 | 2; flag: string }
/** Every value the reader was not sure of, in document order, with what to check. */
export function proposalFlags(proposal: ImportProposal): Flag[] {
  const flags: Flag[] = [];
  const add = (where: string, item: { confidence: 0 | 1 | 2; flag: string | null }) => {
    if (item.confidence !== Confidence.High) flags.push({ where, confidence: item.confidence, flag: item.flag ?? "Check this value." });
  };
  for (const [key, label] of headerFields) add(label, proposal[key]);
  for (const section of proposal.sections) add(sectionLabel[section.kind], section);
  for (const test of proposal.tests) {
    add(`${test.number ?? ""} ${test.title ?? "Test"}`.trim(), test);
    for (const step of test.steps) add(`${test.number ?? ""} ${step.number ?? step.heading ?? "note"}`.trim(), step);
  }
  return flags;
}

function HeaderValue({ label, field }: { label: string; field: ImportField }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="flex items-center gap-1 text-sm">{field.value ?? "–"}<Mark confidence={field.confidence} /></dd></div>;
}

/** The proposal laid out as the STP will be stored, each unsure value marked. */
export function StpProposalView({ proposal }: { proposal: ImportProposal }) {
  return <div className="space-y-4">
    <dl className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-3">{headerFields.map(([key, label]) => <HeaderValue key={key} label={label} field={proposal[key]} />)}</dl>
    {proposal.sections.map((section) => <div key={section.kind} className="rounded-md border p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">{sectionLabel[section.kind]}<Mark confidence={section.confidence} /></p>
      <p className="whitespace-pre-line break-words text-sm">{section.text ?? "–"}</p></div>)}
    {proposal.tests.map((test, index) => <section key={`${test.testKey ?? ""}-${String(index)}`} aria-label={test.title ?? `Test ${String(index + 1)}`} className="space-y-2 rounded-md border p-3">
      <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">{test.number} {test.title}<Mark confidence={test.confidence} />
        <span className="text-xs font-normal text-muted-foreground">Key: {test.testKey ?? "new"}</span></h3>
      <ol className="space-y-2">{test.steps.map((step, position) => <li key={position} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-sm">
        <span className="text-muted-foreground">{step.kind === StepKind.Step ? step.number : ""}</span>
        <div className={step.kind === StepKind.Conditions ? "rounded bg-muted/50 p-2" : ""}>
          <p className="flex items-center gap-2 font-medium">{step.heading}<Mark confidence={step.confidence} /></p>
          <p className="whitespace-pre-line break-words">{step.text}</p>
          {step.referenceCode ? <Badge variant="outline" className="mt-1">Refers to {step.referenceCode}</Badge> : null}
        </div></li>)}</ol>
    </section>)}
  </div>;
}
