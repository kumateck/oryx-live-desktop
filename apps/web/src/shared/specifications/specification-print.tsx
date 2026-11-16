import { formatDate, formatDateTime } from "@/shared/format/dates";
import type { DomainEntitiesSpecificationsSpecificationPrintHistory, DomainEntitiesSpecificationsSpecificationPrintRevision } from "@/shared/api/generated/analytical";
import { PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
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

/** One row per revision number (the server keeps each revision's latest record), earliest revision first. */
const revisionColumns: readonly PrintColumn<DomainEntitiesSpecificationsSpecificationPrintRevision>[] = [
  { id: "number", header: "Sr. No.", width: "8%", cell: (_row, index) => index + 1 },
  { id: "revision", header: "Revision No.", width: "14%", cell: (row) => row.revisionNumber ?? "—" },
  { id: "effective", header: "Effective Date", width: "18%", cell: (row) => formatDate(row.effectiveDate) ?? "—" },
  { id: "reason", header: "Reason for Change", cell: (row) => row.reason ?? (row.event === "Revised" ? "Not recorded" : "—") },
];

/** "Quality Assurance" reads "Quality Assurance Department"; a name that already says so is kept. */
const departmentRow = (name: string | null | undefined) => name ? /department/i.test(name) ? name : `${name} Department` : null;
/** The title row: a product's stage ("Bulk Product Specification"), or the material kind. */
function titleRow(kind: "raw" | "packaging" | "product", stage: number | null) {
  if (kind === "product") { const label = testStageLabel(stage); return label === "–" ? "Product Specification" : `${label} Product Specification`; }
  return kind === "packaging" ? "Packaging Material Specification" : "Raw Material Specification";
}

/** The bordered header of the master copy: department, title, then number | product | dates. */
function SpecificationHeader({ kind, specification }: { kind: "raw" | "packaging" | "product"; specification: Specification }) {
  const department = departmentRow(specification.createdBy?.department);
  return <table className="print-spec-header" aria-label="Specification header"><tbody>
    {/* Always five rows: department, title, then the three rows of number | subject | dates. */}
    <tr><td colSpan={3} className="print-spec-banner">{department ?? ""}</td></tr>
    <tr><td colSpan={3} className="print-spec-banner">{titleRow(kind, specification.testStage)}</td></tr>
    <tr>
      <td>Specification No.: {specification.number}</td>
      <td rowSpan={3} className="print-spec-subject"><span>{specification.item?.name ?? "–"}</span>{specification.item?.code ? <span>({specification.item.code})</span> : null}</td>
      <td />
    </tr>
    <tr><td>Revision No.: {specification.revisionNumber ?? "–"}</td><td>Effective Date: {formatDate(specification.effectiveDate) ?? "–"}</td></tr>
    <tr><td>Supersedes: {specification.supersedesNumber ?? "–"}</td><td>Review Date: {formatDate(specification.reviewDate) ?? "–"}</td></tr>
  </tbody></table>;
}

export function SpecificationPrint({ title, kind, specification, sections, history }: {
  title: string;
  specification: Specification;
  sections: readonly SpecificationSection[];
  /** The kind of specification: it names the title row, and a product's stage is part of it. */
  kind: "raw" | "packaging" | "product";
  history: DomainEntitiesSpecificationsSpecificationPrintHistory;
}) {
  return <>
    <PrintHeader title={title} reference={specification.number} />
    <SpecificationHeader kind={kind} specification={specification} />
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
