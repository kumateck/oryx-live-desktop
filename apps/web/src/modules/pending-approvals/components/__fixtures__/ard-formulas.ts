import { QuestionType } from "@/shared/questions/question-types";

const drying = { type: 0, expression: "(:W2 - :W3) / (:W2 - :W1)", percent: true, decimalPlaces: 2 };
const assay = {
  type: 3, expression: "((:sampleAvg - :standardAvg) * :factor * :equiv / :sampleInput.wt) * (100 / (100 - :LoD))", decimalPlaces: 2, percentageResults: true,
  headers: ["Blank", "Sample 1", "Sample 2"], standardInTable: true, firstColumnPurpose: "blank", numberOfSamples: 2, numberOfReadings: 1,
  rowHeaders: [{ id: "r1", label: "Reading 1" }],
  standardInputs: [{ key: "wt", label: "Weight (g)", value: "" }], sampleInputs: [[{ key: "wt", label: "Weight (g)", value: "" }], [{ key: "wt", label: "Weight (g)", value: "" }]],
  manualVarLabels: { factor: "Factor", equiv: "Equivalent", LoD: "Loss on drying" },
};
export const formulaForm = { sections: [
  { id: "lod", name: "Loss on Drying", description: "Maximum 0.5%", order: 1, fields: [{ id: "f-lod", question: { label: "Loss on Drying", type: QuestionType.Formula, options: [{ name: JSON.stringify(drying) }] } }] },
  { id: "assay", name: "Assay", description: "99.0 – 101.0% (Dried substance)", order: 2, fields: [{ id: "f-assay", question: { label: "Assay – Titration", type: QuestionType.Formula, options: [{ name: JSON.stringify({ type: 3, settings: assay }) }] } }] },
] };
export const formulaAnswers = [
  { responseId: "doc-1", formField: { id: "f-lod" }, value: JSON.stringify({ W2: 12, W3: 11.99, W1: 10 }), complies: true },
  { responseId: "doc-1", formField: { id: "f-assay" }, value: JSON.stringify({ standardInputs: { wt: "0.02" }, sampleInputs: [{ wt: "0.25" }, { wt: "0.35" }], tableData: [["0.1", "0.35", "0.35"]],
    manualVars: { factor: { label: "", raw: "0.2", evaluated: 0.2 }, equiv: { label: "", raw: "0.5", evaluated: 0.5 }, LoD: { label: "", raw: "0.35", evaluated: 0.35 } } }), complies: false },
];
