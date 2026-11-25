import { CoaReportedLimit, CoaReportedResults } from "@/shared/ard-view/raw-data/coa-reported-results";
import { certificateReportedResults, reportedResultSchema } from "@/shared/ard-view/raw-data/coa-reporting";
import StoredFormulaResult from "@/shared/ard-view/raw-data/print/stored-formula-result";
import { z } from "zod";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { normalizeFormulaResponse } from "@/shared/ard-view/raw-data/print/normalize-formula-response";
import { storedFormulaEvaluations } from "@/shared/ard-view/raw-data/print/stored-formula-evaluations";

const object = z.record(z.string(), z.json());
const capturedResults = z.array(reportedResultSchema);
function readResultObject(value: string): z.infer<typeof object> | null {
  try {
    const parsed = object.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function CertificateSpecification({ value, original }: { value: string; original: string }) {
  const parsed = value.includes('"coaReportedResults"') ? readResultObject(normalizeFormulaResponse(value)) : null;
  const reported = capturedResults.safeParse(parsed?.coaReportedResults);
  const visible = reported.success ? certificateReportedResults(reported.data) : [];
  if (!visible.length || visible.some(result => !result.converted)) return <RichTextView html={original || "–"} />;
  return <div className="space-y-1">
    {visible.map(result => <CoaReportedLimit key={result.key} result={result} certificate />)}
  </div>;
}

const scalar = (value: z.infer<ReturnType<typeof z.json>>): string | null => typeof value === "string" || typeof value === "number" ? String(value) : null;
function readings(value: z.infer<ReturnType<typeof z.json>>, path = ""): { label: string; value: string }[] {
  const text = scalar(value);
  if (text !== null) return [{ label: path, value: text || "—" }];
  if (Array.isArray(value)) return value.flatMap((entry, index) => readings(entry, `${path} ${index + 1}`));
  if (value && typeof value === "object") {
    if ("raw" in value) return [{ label: path, value: scalar(value.raw ?? null) || "—" }];
    return Object.entries(value).flatMap(([key, entry]) => readings(entry, path ? `${path} / ${key}` : key));
  }
  return [];
}

/** An issued snapshot is immutable: show what it stored, without fetching today's template or recomputing it. */
export function CertificateResult({ value, unit }: { value: string; unit: string | null }) {
  const normalized = normalizeFormulaResponse(value);
  const parsed = readResultObject(normalized);
  if (parsed && "coaReportedResults" in parsed) {
    const reported = capturedResults.safeParse(parsed.coaReportedResults);
    return reported.success ? <CoaReportedResults response={{ coaReportedResults: reported.data }} certificate />
      : <p role="alert">The captured assay reporting result could not be read.</p>;
  }
  if (parsed?.formulaGoverned === true) return <StoredFormulaResult response={{
    formulaGoverned: true, formulaResultFinalized: parsed.formulaResultFinalized === true,
    formulaDisplayResultsJson: typeof parsed.formulaDisplayResultsJson === "string" ? parsed.formulaDisplayResultsJson : null,
  }} preferAverage />;
  if (!parsed || typeof parsed.value === "string") return <div className="flex flex-wrap items-baseline gap-1"><RichTextView html={parsed ? String(parsed.value) : normalized} />{unit ? <span>{unit}</span> : null}</div>;
  const explicit = [parsed.finalResult, parsed.result, parsed.calculatedResult].find((entry) => typeof entry === "number" || typeof entry === "string" && entry.trim() !== "");
  if (typeof explicit === "string" || typeof explicit === "number") {
    const text = String(explicit);
    return <div className="flex flex-wrap items-baseline gap-1"><RichTextView html={text} />{unit && !text.trim().endsWith(unit) ? <span>{unit}</span> : null}</div>;
  }
  const stored = storedFormulaEvaluations(normalized);
  const results = stored.average !== null ? [{ label: "Average", result: stored.average }] : stored.entries.filter((entry) => entry.result !== null);
  if (results.length) return <div className="space-y-1">{results.map((entry, index) => <p key={`${entry.label}-${index}`}>
    {results.length > 1 ? `${entry.label}: ` : ""}{entry.result}{unit ? ` ${unit}` : ""}
  </p>)}</div>;
  return <div className="space-y-2">
    <p>Final formula result is not included in this issued snapshot.</p>
    <details><summary className="cursor-pointer font-medium">Recorded inputs</summary><dl className="mt-2 space-y-1">{readings(parsed).map((entry, index) =>
      <div key={`${entry.label}-${index}`}><dt className="font-medium">{entry.label}</dt><dd><RichTextView html={entry.value} /></dd></div>)}</dl></details>
  </div>;
}
