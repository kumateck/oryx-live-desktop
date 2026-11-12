import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { specificationReferenceLabel } from "@/shared/questions/question-types";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
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

export function SpecificationPrint({ title, specification, sections, subjectFacts }: {
  title: string;
  specification: Specification;
  sections: readonly SpecificationSection[];
  subjectFacts: readonly { label: string; value: string | null }[];
}) {
  return <>
    <PrintHeader title={title} reference={specification.number} />
    <PrintFacts facts={[
      ...subjectFacts,
      { label: "Revision", value: specification.revisionNumber },
      { label: "Supersedes", value: specification.supersedesNumber },
      { label: "Status", value: specification.isVerified ? "Approved" : "Not approved" },
      { label: "Effective", value: formatDate(specification.effectiveDate) },
      { label: "Revise by", value: formatDate(specification.reviewDate) },
      { label: "Due", value: formatDate(specification.dueDate) },
      { label: "Reference", value: specification.reference },
      { label: "Template", value: specification.form?.name },
      { label: "Created by", value: specification.createdBy?.name },
      { label: "Department", value: specification.createdBy?.department },
      { label: "Created", value: formatDateTime(specification.createdAt) },
    ]} />
    {specification.description ? <section className="print-note">
      <h2 className="print-section">Notes</h2>
      <RichTextView html={specification.description} />
    </section> : null}
    <PrintTable caption="Tests" columns={columns} rows={sections} rowKey={(section) => section.id} empty="The template has no tests." />
  </>;
}
