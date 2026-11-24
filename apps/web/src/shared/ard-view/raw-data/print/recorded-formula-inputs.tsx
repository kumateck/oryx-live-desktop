import { testVariableLabel } from "@/shared/formula/display/variable-labels";
import { UniformityPreview } from "@/shared/ard-view/response/print/preview/uniformity";
import FormulaPrintPreview from "./formula-print-preview";
import ExpressionRenderer from "@/shared/formula/ui/math/expression-view";
import { FormulaType } from "@/shared/questions/question-types";
import type { ReactNode } from "react";
import { z } from "zod";
import { normalizeFormulaResponse } from "./normalize-formula-response";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import type { QuestionOptionDto } from "@/shared/ard-view/dto";

const json = z.json();
type Json = z.infer<typeof json>;
const object = (value: Json): value is { [key: string]: Json } => value !== null && typeof value === "object" && !Array.isArray(value);
const derived = new Set(["settings", "schema", "type", "formula", "expression", "result", "results", "average", "averageResult", "evaluations", "formulaExecutionId", "executionId", "evaluated"]);
const titles: Record<string, string> = { tableData: "Readings", standardInputs: "Standard inputs", sampleInputs: "Sample inputs", manualVars: "Manual inputs" };
const humanize = (key: string) => titles[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
function read(raw: string): Json {
  try { return json.parse(JSON.parse(raw)); } catch { return raw; }
}

/** Show every saved input without evaluating the formula or substituting configured defaults for missing readings. */
export function RecordedFormulaInputs({ value, option }: { value: string; option?: QuestionOptionDto | undefined }) {
  const saved = read(normalizeFormulaResponse(value));
  const savedSettings = object(saved) ? saved.settings : null;
  const definition = (savedSettings ? evaluationSettings(typeof savedSettings === "string" ? savedSettings : JSON.stringify(savedSettings)) : null)
    ?? evaluationSettings(option?.name ?? "");
  const settings = definition ? read(definition.settings) : null;
  const labels = new Map<string, string>();
  const collect = (entry: Json): void => {
    if (Array.isArray(entry)) { entry.forEach(collect); return; }
    if (!object(entry)) return;
    if (typeof entry.key === "string" && typeof entry.label === "string") labels.set(entry.key, entry.label);
    for (const child of Object.values(entry)) collect(child);
  };
  if (settings) collect(settings);
  if (settings !== null && object(settings) && settings.manualVarLabels && object(settings.manualVarLabels))
    for (const [key, label] of Object.entries(settings.manualVarLabels)) if (typeof label === "string") labels.set(key, label);
  const headers = settings !== null && object(settings) && Array.isArray(settings.headers) ? settings.headers.filter((header): header is string => typeof header === "string") : [];

  if (definition?.type === FormulaType.Universal) return <section aria-label="Recorded formula inputs" className="space-y-4">
    <FormulaPrintPreview settings={definition.settings} response={normalizeFormulaResponse(value)} inputsOnly />
  </section>;

  if (definition?.type === FormulaType.Uniformity) return <section aria-label="Recorded formula inputs">
    <UniformityPreview settings={definition.settings} response={normalizeFormulaResponse(value)} inputsOnly />
  </section>;

  const renderValue = (entry: Json, path: string): ReactNode => {
    if (path === "tableData" && Array.isArray(entry) && entry.every(Array.isArray)) return <div className="max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Reading</th>
        {Array.from({ length: Math.max(headers.length, ...entry.map(row => Array.isArray(row) ? row.length : 0)) }, (_, index) => <th key={index} className="border p-2 text-left">{headers[index] || `Column ${index + 1}`}</th>)}
      </tr></thead><tbody>{entry.map((row, index) => <tr key={index}><th className="border p-2 text-left">Reading {index + 1}</th>
        {Array.isArray(row) ? row.map((cell, column) => <td key={column} className="border p-2">{renderValue(cell, `cell.${index}.${column}`)}</td>) : null}
      </tr>)}</tbody></table>
    </div>;
    if (object(entry) && "raw" in entry) return renderValue(entry.raw ?? null, path);
    if (Array.isArray(entry)) return <ol className="space-y-2 pl-4">{entry.map((child, index) => <li key={`${path}-${index}`} className="min-w-0">
      <span className="font-medium">{path === "sampleInputs" ? "Sample" : "Reading"} {index + 1}: </span>{renderValue(child, `${path}.${index}`)}
    </li>)}</ol>;
    if (object(entry)) return <dl className="space-y-1">{Object.entries(entry).filter(([key]) => !derived.has(key) && !["standardinputs", "sampleinputs", "tabledata", "manualvars"].includes(key)).map(([key, child]) => <div key={key} className="min-w-0 break-words">
      <dt className="font-medium">{testVariableLabel(key, labels.get(key)) === key ? humanize(key) : testVariableLabel(key, labels.get(key))}</dt><dd className="pl-3">{renderValue(child, path ? `${path}.${key}` : key)}</dd>
    </div>)}</dl>;
    return <span className="whitespace-pre-wrap break-words">{entry === null || entry === "" ? "—" : String(entry)}</span>;
  };
  if (saved === null || saved === "" || object(saved) && Object.keys(saved).every(key => derived.has(key))) return null;
  return <section aria-label="Recorded formula inputs" className="space-y-2 text-sm">
    <h4 className="font-semibold">Recorded inputs</h4>
    {settings !== null && object(settings) && typeof settings.expression === "string" ? <ExpressionRenderer print expression={settings.expression} fallbackToText className="text-sm" /> : null}
    {renderValue(saved, "")}
  </section>;
}
