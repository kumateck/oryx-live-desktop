import type { FormFieldDto, FormResponseDto } from "@/shared/ard-view/dto";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { hasCoaReporting } from "./coa-reporting";

/** The API supplies the same server-calculated values to preview, approval and print. */
export function CoaReportedResults({ response, evidence = false }: { response: FormResponseDto; evidence?: boolean }) {
  if (response.coaReportingError) return <span role="alert" className="text-sm text-destructive print:text-black">{response.coaReportingError}</span>;
  return <div className="space-y-1 text-sm">{response.coaReportedResults?.map(result => <div key={result.key}>
    <p><span className="font-medium">{result.label}: </span>{result.displayValue} {result.unit}</p>
    {evidence && result.converted ? <p className="text-xs text-muted-foreground">Source assay: {result.sourceValue}% of labelled strength; nominal concentration: {result.nominalConcentration}% w/v.</p> : null}
  </div>)}</div>;
}

/** Explicit per-output ranges travel with the result so the specification and result have the same basis. */
export function CoaReportingSpecification({ fields, responses, original }: {
  fields: readonly FormFieldDto[]; responses: ReadonlyMap<string, FormResponseDto>; original: string;
}) {
  const entries = fields.flatMap(field => { const answer = field.id ? responses.get(field.id) : null; return answer && field.id ? [{ fieldId: field.id, answer }] : []; });
  const converted = entries.flatMap(({ fieldId, answer }) => (answer.coaReportedResults ?? []).filter(result => result.converted)
    .map(result => ({ key: `${fieldId}:${result.key}`, result })));
  if (!converted.length) return <RichTextView html={original} />;
  const hasOther = entries.some(({ answer }) => !hasCoaReporting(answer) || answer.coaReportedResults?.some(result => !result.converted));
  return <div className="space-y-1">{hasOther ? <RichTextView html={original} /> : null}{converted.map(({ key, result }) =>
    <p key={key}><span className="font-medium">{result.label}: </span>{result.minimum}–{result.maximum} {result.unit}</p>)}</div>;
}
