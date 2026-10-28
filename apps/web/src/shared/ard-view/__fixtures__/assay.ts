import { QuestionType } from "@/shared/questions/question-types";
import type { FormSectionDto, FormResponseDto } from "../dto";

// Legacy QC aliases; the screenshot-specific unresolved weight is tested separately.
export const assaySettings = { type: 3, expression: "((:spltit-:blktit)*:factor*:equiv/:spl.wt)*(100/(100-:LoD))", decimalPlaces: 2, percentageResults: true,
  standardInTable: true, firstColumnPurpose: "blank", headers: ["Blank", "Sample 1", "Sample 2"], numberOfSamples: 2, numberOfReadings: 1,
  rowHeaders: [{ id: "r1", label: "Reading 1" }], standardInputs: [{ key: "wt", label: "Weight (g)", value: "" }],
  sampleInputs: [[{ key: "wt", label: "Weight (g)", value: "" }], [{ key: "wt", label: "Weight (g)", value: "" }]],
};
export const assayInputs = { standardInputs: { wt: "0.02" }, sampleInputs: [{ wt: "0.25" }, { wt: "0.35" }], tableData: [["0.1", "0.35", "0.35"]], manualVars: {
  spltit: { label: "", raw: "", evaluated: null }, blktit: { label: "", raw: "", evaluated: null }, spltwt: { label: "", raw: "", evaluated: null },
  factor: { label: "", raw: "0.2", evaluated: 0.2 }, equiv: { label: "", raw: "0.5", evaluated: 0.5 }, LoD: { label: "", raw: "0.35", evaluated: 0.35 },
} };
export const assaySection: FormSectionDto = { id: "s-assay", name: "Assay", description: "99.0–101.0% (Dried substance)", fields: [{ id: "f-assay", question: {
  type: QuestionType.Formula, label: "Assay – Titration", options: [{ name: JSON.stringify({ type: 3, settings: assaySettings }) }],
} }] };
export const wrappedAssayAnswer: FormResponseDto = { formField: { id: "f-assay" }, value: JSON.stringify({ value: JSON.stringify(JSON.stringify({
  standardinputs: assayInputs.standardInputs, sampleinputs: assayInputs.sampleInputs, tabledata: assayInputs.tableData, manualvars: assayInputs.manualVars,
})) }) };
