import type { ReactNode } from "react";
import { Link } from "react-router";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { specificationReferenceLabel } from "@/shared/questions/question-types";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { groupSections, type Specification, type SpecificationSection } from "./specification-schema";

const cell = "border-b px-3 py-2 align-top text-sm";

/** The specification's tests: what each checks, its limit, and the pharmacopoeia reference QC set for it. */
export function SpecificationTests({ sections }: { sections: readonly SpecificationSection[] }) {
  if (sections.length === 0) return <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">The template has no tests.</p>;
  const reference = (section: SpecificationSection) => specificationReferenceLabel(section.value) ?? <span className="text-muted-foreground">Not set</span>;
  return <div className="overflow-x-auto rounded-lg border bg-card">
    <table className="w-full min-w-[40rem] table-fixed border-collapse">
      <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground"><tr>
        <th className="w-12 border-b px-3 py-2">No.</th><th className="w-[30%] border-b px-3 py-2">Test</th><th className="border-b px-3 py-2">Specification</th><th className="w-40 border-b px-3 py-2">Reference</th>
      </tr></thead>
      <tbody>{groupSections(sections).map((row, index) => row.type === "test"
        ? <tr key={row.section.id}><td className={cell}>{index + 1}</td><td className={cell}><RichTextView html={row.section.name} /></td>
          <td className={cell}><RichTextView html={row.section.description} /></td><td className={cell}>{reference(row.section)}</td></tr>
        : <tr key={`group:${row.name}`}><td className={cell}>{index + 1}</td>
          <td className={cell}><p className="font-semibold">{row.name}</p><ul className="mt-1 space-y-3 pl-4">{row.sections.map((section) => <li key={section.id} className="list-disc"><RichTextView html={section.name} /></li>)}</ul></td>
          <td className={cell}><p aria-hidden>&nbsp;</p><div className="mt-1 space-y-3">{row.sections.map((section) => <RichTextView key={section.id} html={section.description} />)}</div></td>
          <td className={cell}><p aria-hidden>&nbsp;</p><div className="mt-1 space-y-3">{row.sections.map((section) => <p key={section.id}>{reference(section)}</p>)}</div></td></tr>)}
      </tbody>
    </table>
  </div>;
}

/** A specification's record page: header and facts, its dates and notes, its tests, and who created it. */
export function SpecificationDetail({ specification, sections, crumbs, actions, facts, item }: {
  specification: Specification; sections: readonly SpecificationSection[]; crumbs: readonly PageCrumb[]; actions?: ReactNode;
  /** Extra facts at the top, such as the item's code. */ facts: ReactNode; /** What the specification is for, under the title. */ item: string | null;
}) {
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${specification.number}${item ? ` · ${item}` : ""}`} crumbs={crumbs} actions={actions} />
    <KeyFacts>
      {facts}
      <KeyFact label="Revision" value={specification.revisionNumber ?? "–"} note={specification.supersedesNumber ? `Supersedes ${specification.supersedesNumber}` : undefined} />
      <KeyFact label="Effective" value={formatDate(specification.effectiveDate) ?? "–"} note={specification.reviewDate ? `Revise by ${formatDate(specification.reviewDate) ?? "–"}` : undefined} />
      <KeyFact label="Status" value={specification.isVerified ? <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-5 text-emerald-600" aria-hidden />Approved</span> : "Not approved"} />
    </KeyFacts>
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <DetailGroup title="Specification">
        <DetailItem label="Specification number" value={specification.number} />
        <DetailItem label="Revision" value={specification.revisionNumber} />
        <DetailItem label="Supersedes" value={specification.supersedesNumber} />
        <DetailItem label="Reference" value={specification.reference} />
        <DetailItem label="Template" value={specification.form?.name} />
        <DetailItem label="Due" value={formatDate(specification.dueDate)} />
      </DetailGroup>
      <DetailGroup title="Record">
        <DetailItem label="Created by" value={specification.createdBy?.name} />
        <DetailItem label="Department" value={specification.createdBy?.department} />
        <DetailItem label="Created" value={formatDateTime(specification.createdAt)} />
      </DetailGroup>
    </div>
    {specification.description ? <section aria-label="Notes" className="rounded-lg border bg-card p-4 text-sm"><h2 className="mb-1 text-sm font-semibold">Notes</h2><RichTextView html={specification.description} /></section> : null}
    <section aria-label="Tests" className="space-y-2"><h2 className="text-sm font-semibold">Tests{specification.form ? <Badge variant="outline" className="ml-2 font-normal">{specification.form.name}</Badge> : null}</h2>
      <SpecificationTests sections={sections} /></section>
  </article>;
}

/** Shown when a specification cannot be loaded or read. */
export function SpecificationUnavailable({ message, onRetry, back }: { message: string; onRetry: () => void; back: { label: string; to: string } }) {
  return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Specification unavailable</h1>
    <p className="text-sm text-muted-foreground">{message}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={onRetry}>Retry</Button><Button asChild size="sm"><Link to={back.to}>{back.label}</Link></Button></div></div>;
}
