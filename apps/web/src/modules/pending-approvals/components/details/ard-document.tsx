import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PrintFacts, PrintHeader, PrintSignatures } from "@/shared/print/print-sheet";
import { ArdResultsTable } from "./ard-results-table";
import type { ArdResultSection } from "../../schemas/ard-result-schema";
import type { RecordedAnswer } from "../../lib/ard-results";
import "./ard-document.css";

export type CertificateSection = ArdResultSection;
export interface CertificateFacts {
  kind: "material" | "product"; name: string | null; code: string | null; batch: string | null; manufactured: string | null | undefined; expires: string | null | undefined;
  arNumber: string | null; specNumber: string | null; sampled: string | null | undefined; analysed: string | null | undefined;
}

export interface ArdDocumentProps {
  facts: CertificateFacts; sections: readonly CertificateSection[]; recorded: ReadonlyMap<string, RecordedAnswer>;
}

/** Shared certificate content for on-page review and printing; worksheets retain the full recorded evidence. */
export function ArdDocument({ facts, sections, recorded, worksheet = false }: ArdDocumentProps & { worksheet?: boolean }) {
  const title = `${worksheet ? "Worksheet" : "Certificate of analysis"} · ${facts.kind}`;
  return <div className="ard-document">
    <PrintHeader title={title} reference={facts.arNumber ? `QC AR ${facts.arNumber}` : null} aside={<p>Quality Control Department</p>} />
    <PrintFacts facts={[
      { label: facts.kind === "material" ? "Material" : "Product", value: [facts.name, facts.code].filter(Boolean).join(" · ") || null },
      { label: "Batch", value: facts.batch }, { label: "Specification", value: facts.specNumber },
      { label: "Manufactured", value: formatMonthYear(facts.manufactured) }, { label: "Expires", value: formatMonthYear(facts.expires) },
      { label: "Sampled", value: formatDate(facts.sampled) }, { label: "Analysed", value: formatDate(facts.analysed) },
    ]} />
    <ArdResultsTable sections={sections} recorded={recorded} certificate={!worksheet} />
    <PrintSignatures roles={["Analysed by", "Checked by", "Approved by"]} />
  </div>;
}
