import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { getResponsesForSection } from "@/shared/ard-view/templates/render";
import { complianceLabels, testCompliance, type RecordedAnswer } from "../../lib/ard-results";
import type { ArdResultSection } from "../../schemas/ard-result-schema";
import type { ardDisplayData } from "../../lib/ard-display-data";

/** A COA reports results and observations; the approval worksheet contains the detailed equations. */
export function ArdCoaResults({ sections, recorded, data }: {
  sections: readonly ArdResultSection[]; recorded: ReadonlyMap<string, RecordedAnswer>; data: ReturnType<typeof ardDisplayData>;
}) {
  const responses = new Map(data.responses.flatMap((response) => response.formField?.id ? [[response.formField.id, response] as const] : []));
  return <div className="max-w-full overflow-x-auto"><table className="print-table w-full table-fixed text-sm">
    <caption className="sr-only">Certificate tests, results and specifications</caption>
    <thead><tr>{["No.", "Test", "Result / observation", "Specification", "Compliance"].map((label, index) =>
      <th key={label} scope="col" className={index === 0 ? "w-10" : undefined}>{label}</th>)}</tr></thead>
    <tbody>{data.sections.map((section, index) => <tr key={section.id ?? index}>
      <td>{index + 1}</td><td><RichTextView html={section.name} /></td>
      <td>{getResponsesForSection(section.fields ?? [], responses)}</td><td><RichTextView html={section.description} /></td>
      <td>{complianceLabels[testCompliance((sections[index]?.fields ?? []).map((field) => field.id), recorded)]}</td>
    </tr>)}</tbody>
  </table></div>;
}
