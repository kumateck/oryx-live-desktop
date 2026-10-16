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
  const fact = (label: string, value: string | null) => <p><span className="font-semibold">{label}:</span> {value ?? "–"}</p>;
  return <div className="mx-auto max-w-4xl border bg-card p-6 text-sm">
    <div className="mb-4 space-y-1 text-center"><h2 className="text-base font-bold">QUALITY CONTROL DEPARTMENT</h2><h3 className="font-semibold">CERTIFICATE OF ANALYSIS FOR {kind.toUpperCase()}</h3></div>
    <div className="mb-4 grid grid-cols-2 gap-2 border p-4">
      <div>{fact("Batch No.", facts.batchNumber)}{fact("Date of Mfg.", formatMonthYear(facts.made))}{fact("Date of Exp.", formatMonthYear(facts.expires))}</div>
      <div>{fact("Sampled date", formatDate(facts.sampled))}{fact("Analysed date", formatDate(facts.analysed))}</div>
      <div className="col-span-2">{fact("QC AR No.", facts.arNumber)}</div>
    </div>
    <p className="mb-4 border p-4 font-semibold">{facts.subject}</p>
    {extra.length ? <dl className="mb-4 grid grid-cols-[8rem_1fr] border">{extra.map((row) => [<dt key={`${row.label}-label`} className="border p-2 font-semibold">{row.label}</dt>, <dd key={`${row.label}-value`} className="border p-2">{row.value ?? "–"}</dd>])}</dl> : null}
    <div className="max-w-full overflow-x-auto"><table className="mb-4 w-full table-fixed border-collapse border text-sm">
      <colgroup><col className="w-10" /><col className="w-1/4" /><col className="w-1/4" /><col className="w-44" /><col /></colgroup>
      <thead><tr className="bg-muted text-left">{["No.", "Test", "Result / observation", "Compliance", "Specification"].map((head) => <th key={head} scope="col" className="border p-2">{head}</th>)}</tr></thead>
      <tbody>{sections.map((section, index) => { const item = compliance.find((entry) => entry.formSectionId === section.id);
        return <tr key={section.id ?? index}><td className="border p-2 text-center align-top">{index + 1}</td><td className="border p-2 align-top font-medium"><RichTextView html={section.name} /></td>
          <td className="border p-2 align-top">{getResponsesForSection(section.fields ?? [], responseMap)}</td>
          <td className="border p-2 align-top">{section.id ? <div className="space-y-1"><CoaComplianceControl formSectionId={section.id} complies={item?.complies === true} onComplianceChange={onCompliance} />
            {item?.requiresReview ? <p className="text-xs text-warning">Check this: it could not be worked out from the result.</p> : null}</div> : "–"}</td>
          <td className="border p-2 align-top"><RichTextView html={section.description} /></td></tr>; })}</tbody>
    </table></div>
    <p className="font-semibold">Comment: <span className="font-normal">{certificateComment(compliance, kind)}</span></p>
  </div>;
}
