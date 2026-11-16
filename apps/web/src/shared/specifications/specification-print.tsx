import { formatDate, formatDateTime } from "@/shared/format/dates";
import type { DomainEntitiesSpecificationsSpecificationPrintHistory, DomainEntitiesSpecificationsSpecificationPrintRevision } from "@/shared/api/generated/analytical";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { specificationReferenceLabel } from "@/shared/questions/question-types";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { testStageLabel } from "./specification-rules";
import type { Specification, SpecificationSection } from "./specification-schema";

const columns: readonly PrintColumn<SpecificationSection>[] = [
  { id: "number", header: "No.", width: "7%", cell: (_section, index) => index + 1 },
  { id: "test", header: "Test", width: "30%", cell: (section) => <>
    {section.group ? <small>{section.group}</small> : null}
    <RichTextView html={section.name} />
  </> },
  { id: "limit", header: "Specification", cell: (section) => <RichTextView html={section.description} /> },
  { id: "reference", header: "Reference", width: "20%", cell: (section) => specificationReferenceLabel(section.value) ?? "Not set" },
];

/** One row per revision number (the server keeps each revision's latest record), newest first. */
const revisionColumns: readonly PrintColumn<DomainEntitiesSpecificationsSpecificationPrintRevision>[] = [
  { id: "number", header: "Sr. No.", width: "8%", cell: (_row, index) => index + 1 },
  { id: "revision", header: "Revision No.", width: "14%", cell: (row) => row.revisionNumber ?? "—" },
  { id: "effective", header: "Effective Date", width: "18%", cell: (row) => formatDate(row.effectiveDate) ?? "—" },
  { id: "reason", header: "Reason for Change", cell: (row) => row.reason ?? (row.event === "Revised" ? "Not recorded" : "—") },
];

export function SpecificationPrint({ title, subject, specification, sections, history }: {
  title: string;
  specification: Specification;
  sections: readonly SpecificationSection[];
  /** What the specification is for: its name and code head the print. */
  subject: "Product" | "Material";
  history: DomainEntitiesSpecificationsSpecificationPrintHistory;
}) {
  return <>
    <PrintHeader title={title} reference={specification.number} />
    <PrintFacts facts={[
      { label: "Spec No.", value: specification.number },
      { label: "Revision No.", value: specification.revisionNumber },
      { label: "Supersedes", value: specification.supersedesNumber },
      { label: subject, value: specification.item?.name ?? null },
      { label: `${subject} Code`, value: specification.item?.code ?? null },
      // Only a product specification has a test stage (in-process, bulk or finished product).
      ...(subject === "Product" ? [{ label: "Stage", value: testStageLabel(specification.testStage) }] : []),
      { label: "Effective Date", value: formatDate(specification.effectiveDate) },
      { label: "Review Date", value: formatDate(specification.reviewDate) },
    ]} />
    {specification.description ? <section className="print-note">
      <h2 className="print-section">Notes</h2>
      <RichTextView html={specification.description} />
    </section> : null}
    <PrintTable caption="Tests" columns={columns} rows={sections} rowKey={(section) => section.id} empty="The template has no tests." />
    <PrintTable caption="Revision History" columns={revisionColumns} rows={history.revisions ?? []}
      rowKey={(row, index) => `${row.revisionNumber ?? ""}-${index}`} empty="No recorded revision history is available." />
    {history.historyAvailableFrom ? <p className="print-note">History capture began {formatDateTime(history.historyAvailableFrom)}.</p> : null}
  </>;
}
