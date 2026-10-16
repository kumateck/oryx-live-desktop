import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { complianceLabels, testCompliance, type RecordedAnswer } from "../../lib/ard-results";

export interface CertificateSection { id?: string | null | undefined; name: string | null; description: string | null; fields: readonly { id?: string | null | undefined; label: string | null }[] }
export interface CertificateFacts {
  kind: "material" | "product"; name: string | null; code: string | null; batch: string | null; manufactured: string | null | undefined; expires: string | null | undefined;
  arNumber: string | null; specNumber: string | null; sampled: string | null | undefined; analysed: string | null | undefined;
}

/**
 * The certificate of analysis as it would be issued from this data: each test with its result, the
 * specification and whether it complies. A preview only; nothing is generated or saved.
 */
export function ArdCertificate({ facts, sections, recorded, onClose }: { facts: CertificateFacts; sections: readonly CertificateSection[]; recorded: ReadonlyMap<string, RecordedAnswer>; onClose: () => void }) {
  const columns: PrintColumn<CertificateSection>[] = [
    { id: "number", header: "No.", cell: (_row, index) => index + 1, width: "6%" },
    { id: "test", header: "Test", cell: (row) => row.name ? <RichTextView html={row.name} /> : "–", width: "24%" },
    { id: "result", header: "Result / observation", cell: (row) => {
      const lines = row.fields.flatMap((field, index) => { const answer = field.id ? recorded.get(field.id) : undefined;
        return answer?.value ? [<div key={field.id ?? index}>{row.fields.length > 1 && field.label ? `${field.label}: ` : ""}<RichTextView html={answer.value} className="inline" /></div>] : []; });
      return lines.length ? lines : "No result";
    } },
    { id: "specification", header: "Specification", cell: (row) => row.description ? <RichTextView html={row.description} /> : "–" },
    { id: "compliance", header: "Compliance", cell: (row) => complianceLabels[testCompliance(row.fields.map((field) => field.id), recorded)], width: "14%" },
  ];
  const title = `Certificate of analysis · ${facts.kind === "material" ? "material" : "product"}`;
  return <PrintPreviewDialog title={facts.name ?? "Certificate of analysis"} note="A preview of the certificate from the recorded results. Nothing is generated or saved." onClose={onClose}>
    <PrintHeader title={title} reference={facts.arNumber ? `QC AR ${facts.arNumber}` : null} aside={<p>Quality Control Department</p>} />
    <PrintFacts facts={[
      { label: facts.kind === "material" ? "Material" : "Product", value: [facts.name, facts.code].filter(Boolean).join(" · ") || null },
      { label: "Batch", value: facts.batch }, { label: "Specification", value: facts.specNumber },
      { label: "Manufactured", value: formatMonthYear(facts.manufactured) }, { label: "Expires", value: formatMonthYear(facts.expires) },
      { label: "Sampled", value: formatDate(facts.sampled) }, { label: "Analysed", value: formatDate(facts.analysed) },
    ]} />
    <PrintTable columns={columns} rows={sections} rowKey={(row, index) => row.id ?? String(index)} empty="No tests on this data sheet" />
    <PrintSignatures roles={["Analysed by", "Checked by", "Approved by"]} />
  </PrintPreviewDialog>;
}
