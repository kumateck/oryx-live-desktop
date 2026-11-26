import type { FormFieldDto, FormResponseDto } from "@/shared/ard-view/dto";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { certificateReportedResults, isAssayAverage } from "./coa-reporting";

type ReportedResult = NonNullable<FormResponseDto["coaReportedResults"]>[number];

/** The API supplies the same server-calculated values to preview, approval and print. */
export function CoaReportedResults({ response }: { response: FormResponseDto; certificate?: boolean }) {
  const results = response.coaReportedResults ?? [];
  const visible = certificateReportedResults(results);
  return <div className="space-y-1 text-sm">
    {response.coaReportingError ? <span role="alert" className="text-sm text-destructive print:text-black">{response.coaReportingError}</span> : null}
    {visible.map(result => <p key={result.key}>
      {!isAssayAverage(result) ? <span className="font-medium">{result.label}: </span> : null}
      {result.displayValue} {result.unit}
    </p>)}
  </div>;
}

export function CoaReportedLimit({ result }: { result: ReportedResult; certificate?: boolean }) {
  return <p>
    {!isAssayAverage(result) ? <span className="font-medium">{result.label}: </span> : null}
    {result.minimum}–{result.maximum} {result.unit}
  </p>;
}

/** Explicit per-output ranges travel with the result so the specification and result have the same basis. */
export function CoaReportingSpecification({ fields, responses, original, certificate = false }: {
  fields: readonly FormFieldDto[]; responses: ReadonlyMap<string, FormResponseDto>; original: string; certificate?: boolean;
}) {
  const entries = fields.flatMap(field => {
    const answer = field.id ? responses.get(field.id) : null;
    if (!answer || !field.id) return [];
    const results = answer.coaReportedResults ?? [];
    return [{ fieldId: field.id, results: certificateReportedResults(results) }];
  });
  const converted = entries.flatMap(({ fieldId, results }) => results.filter(result => result.converted)
    .map(result => ({ key: `${fieldId}:${result.key}`, result })));
  if (!converted.length) return <RichTextView html={original} />;
  const hasOriginal = entries.some(({ results }) => !results.length || results.some(result => !result.converted));
  return <div className="space-y-1">
    {hasOriginal ? <RichTextView html={original} /> : null}
    {converted.map(({ key, result }) => <CoaReportedLimit key={key} result={result} certificate={certificate} />)}
  </div>;
}
