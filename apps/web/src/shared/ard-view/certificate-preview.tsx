import { useMemo } from "react";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import type { FormResponseDto, FormSectionDto } from "./dto";
import CoaComplianceControl from "./raw-data/coa-compliance-control";
import type { CoaComplianceItem } from "./raw-data/coa-compliance";
import { getBestResponseMap } from "./raw-data/print/response-pick";
import { getResponsesForSection } from "./templates/render";

export interface CertificateFacts { batchNumber: string | null; made: string | null; expires: string | null; arNumber: string | null; sampled: string | null; analysed: string | null; subject: string }

/** "Complies with In-House specification" only when every test is marked as complying. */
export const certificateComment = (items: readonly CoaComplianceItem[], subject: "Material" | "Product") =>
  items.length > 0 && items.every((item) => item.complies) ? `${subject} complies with In-House specification.` : `${subject} does not comply with In-House specification.`;

/**
 * A certificate of analysis as it will be issued: the batch, each test with its result and specification, and whether it complies.
 * Compliance is inferred from the result against the specification and can be corrected test by test before the certificate is generated.
 */
export function CertificatePreview({ kind, facts, extra = [], sections, responses, compliance, onCompliance }: {
  kind: "Material" | "Product"; facts: CertificateFacts; extra?: readonly { label: string; value: string | null }[]; sections: readonly FormSectionDto[]; responses: readonly FormResponseDto[]; compliance: readonly CoaComplianceItem[];
  onCompliance: (sectionId: string, complies: boolean) => void;
}) {
  const responseMap = useMemo(() => getBestResponseMap([...responses]), [responses]);
  const fact = (label: string, value: string | null) => <div className="min-w-0"><dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words font-medium">{value ?? "–"}</dd></div>;
  const compliantCount = compliance.filter((item) => item.complies).length;
  return <article aria-label="Certificate document preview" className="mx-auto max-w-5xl overflow-hidden rounded-lg border bg-card text-sm shadow-sm">
    <header className="border-b bg-muted/20 px-5 py-5 text-center sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quality control department</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">Certificate of Analysis</h2>
      <p className="mt-1 text-xs text-muted-foreground">{kind} · Batch quality record</p>
    </header>
    <div className="space-y-5 p-4 sm:p-6">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-md border bg-background p-4 sm:grid-cols-3 lg:grid-cols-4">
        {fact("Batch number", facts.batchNumber)}{fact("Manufactured", formatMonthYear(facts.made))}{fact("Expiry", formatMonthYear(facts.expires))}
        {fact("QC AR number", facts.arNumber)}{fact("Sampled", formatDate(facts.sampled))}{fact("Analysed", formatDate(facts.analysed))}
      </dl>
      <section aria-label="Material or product" className="rounded-md border-l-2 border-primary bg-muted/20 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{kind}</p>
        <p className="mt-1 break-words font-semibold">{facts.subject}</p>
      </section>
      {extra.length ? <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">{extra.map((row) => <div key={row.label} className="min-w-0 bg-background px-3 py-2"><dt className="text-xs text-muted-foreground">{row.label}</dt><dd className="mt-0.5 break-words font-medium">{row.value ?? "–"}</dd></div>)}</dl> : null}
      <section aria-label="Test results" className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Test results</h3><p className="text-xs text-muted-foreground">Review each result and confirm its specification compliance.</p></div>
          <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">{compliantCount} of {sections.length} comply</span></div>
        <div className="max-w-full overflow-x-auto rounded-md border"><table className="w-full min-w-[760px] border-collapse text-sm">
          <colgroup><col className="w-10" /><col className="w-[18%]" /><col className="w-[22%]" /><col className="w-[20%]" /><col /></colgroup>
          <thead><tr className="bg-muted/60 text-left">{["No.", "Test", "Result / observation", "Compliance review", "Specification"].map((head) => <th key={head} scope="col" className="border-b px-3 py-2.5 text-xs font-semibold text-muted-foreground">{head}</th>)}</tr></thead>
          <tbody>{sections.map((section, index) => { const item = compliance.find((entry) => entry.formSectionId === section.id);
            return <tr key={section.id ?? index} className="align-top [&:not(:last-child)>td]:border-b"><td className="px-3 py-3 text-center text-xs text-muted-foreground">{index + 1}</td>
              <td className="px-3 py-3 font-medium"><RichTextView html={section.name} /></td>
              <td className="px-3 py-3"><div className="break-words">{getResponsesForSection(section.fields ?? [], responseMap)}</div></td>
              <td className="px-3 py-3">{section.id ? <div className="min-w-0 space-y-2"><CoaComplianceControl formSectionId={section.id} complies={item?.complies === true} onComplianceChange={onCompliance} />
                {item?.requiresReview ? <p className="text-xs text-warning">Review required: result cannot be assessed automatically.</p> : null}</div> : "–"}</td>
              <td className="px-3 py-3"><div className="break-words"><RichTextView html={section.description} /></div></td></tr>; })}</tbody>
        </table></div>
      </section>
      <section className="rounded-md border bg-muted/20 px-4 py-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overall assessment</p>
        <p className="mt-1 font-medium">{certificateComment(compliance, kind)}</p></section>
    </div>
  </article>;
}
