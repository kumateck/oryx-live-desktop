import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures } from "@/shared/print/print-sheet";
import { ArdResultsTable } from "./ard-results-table";
import type { ArdResultSection } from "../../schemas/ard-result-schema";
import { type RecordedAnswer } from "../../lib/ard-results";

export type CertificateSection = ArdResultSection;
export interface CertificateFacts {
  kind: "material" | "product"; name: string | null; code: string | null; batch: string | null; manufactured: string | null | undefined; expires: string | null | undefined;
  arNumber: string | null; specNumber: string | null; sampled: string | null | undefined; analysed: string | null | undefined;
}

/**
 * The certificate of analysis as it would be issued from this data: each test with its result, the
 * specification and whether it complies. A preview only; nothing is generated or saved.
 */
export function ArdCertificate({ facts, sections, recorded, onClose }: { facts: CertificateFacts; sections: readonly CertificateSection[]; recorded: ReadonlyMap<string, RecordedAnswer>; onClose: () => void }) {
  const title = `Certificate of analysis · ${facts.kind === "material" ? "material" : "product"}`;
  return <PrintPreviewDialog title={facts.name ?? "Certificate of analysis"} note="A preview of the certificate from the recorded results. Nothing is generated or saved." onClose={onClose}>
    <PrintHeader title={title} reference={facts.arNumber ? `QC AR ${facts.arNumber}` : null} aside={<p>Quality Control Department</p>} />
    <PrintFacts facts={[
      { label: facts.kind === "material" ? "Material" : "Product", value: [facts.name, facts.code].filter(Boolean).join(" · ") || null },
      { label: "Batch", value: facts.batch }, { label: "Specification", value: facts.specNumber },
      { label: "Manufactured", value: formatMonthYear(facts.manufactured) }, { label: "Expires", value: formatMonthYear(facts.expires) },
      { label: "Sampled", value: formatDate(facts.sampled) }, { label: "Analysed", value: formatDate(facts.analysed) },
    ]} />
    <ArdResultsTable sections={sections} recorded={recorded} certificate />
    <PrintSignatures roles={["Analysed by", "Checked by", "Approved by"]} />
  </PrintPreviewDialog>;
}
