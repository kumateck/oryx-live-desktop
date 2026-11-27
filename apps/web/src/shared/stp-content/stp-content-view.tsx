import { Badge } from "@/components/ui/badge";
import { sectionKinds, sectionLabel, StepKind, type RevisionDetail } from "./stp-content";

/** One test as printed: 5.N title, then its steps (5.N.M), conditions blocks and notes in order. */
function TestView({ test }: { test: RevisionDetail["tests"][number] }) {
  return <section aria-label={`${test.number ?? ""} ${test.title}`.trim()} className="space-y-2 rounded-md border p-3">
    <h3 className="flex flex-wrap items-baseline gap-2 text-sm font-semibold"><span>{test.number ? `${test.number} ` : ""}{test.title}</span>
      <span className="text-xs font-normal text-muted-foreground">Key: {test.testKey}</span></h3>
    <ol className="space-y-2">{test.steps.map((step) => <li key={step.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-sm">
      <span className="text-muted-foreground">{step.kind === StepKind.Step ? step.number ?? "" : ""}</span>
      <div className={step.kind === StepKind.Conditions ? "rounded bg-muted/50 p-2" : ""}>
        {step.heading ? <p className="font-medium">{step.heading}</p> : null}
        {step.text ? <p className="whitespace-pre-line break-words">{step.text}</p> : null}
        {step.referenceCode ? <Badge variant="outline" className="mt-1">Refers to {step.referenceCode}</Badge> : null}
      </div></li>)}</ol>
  </section>;
}

/** A revision's content as the STP prints it: sections 1.0 to 4.0, reagents, notes, then the 5.N tests. */
export function StpContentView({ revision }: { revision: Pick<RevisionDetail, "sections" | "tests"> }) {
  const sections = sectionKinds.map((kind) => ({ kind, section: revision.sections.find((item) => item.kind === kind) }))
    .filter(({ section }) => section?.text);
  return <div className="space-y-4">
    <dl className="space-y-3">{sections.map(({ kind, section }) => <div key={kind} className="rounded-md border p-3">
      <dt className="text-sm font-semibold">{sectionLabel[kind]}</dt>
      <dd className="whitespace-pre-line break-words text-sm">{section?.text}</dd></div>)}</dl>
    <div className="space-y-2"><h2 className="text-sm font-semibold">5.0 Procedure</h2>
      {revision.tests.length ? revision.tests.map((test) => <TestView key={test.id} test={test} />)
        : <p className="text-sm text-muted-foreground">No tests yet.</p>}</div>
  </div>;
}
