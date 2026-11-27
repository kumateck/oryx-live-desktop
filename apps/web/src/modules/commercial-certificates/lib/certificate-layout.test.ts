import { expect, it } from "vitest";
import { certificateRows } from "@/modules/qc-routines/lib/routines";
import { certificateLayout } from "./certificate-layout";

// Paracetamol 120 Syrup: chemical tests, Identification Test A/B as a group, and three microbial tests.
const rows = certificateRows(JSON.stringify([
  { AnalysisType: 1, FormFieldId: "tamc", DisplayLabel: "Total viable aerobic count", SpecificationText: "NMT 200 CFU/mL", result: "<10" },
  { AnalysisType: 0, FormFieldId: "desc", DisplayLabel: "Description", result: "Complies" },
  { AnalysisType: 0, FormFieldId: "ida", DisplayLabel: "Test A", GroupName: "Identification", result: "Complies" },
  { AnalysisType: 0, FormFieldId: "idb", DisplayLabel: "Test B", GroupName: "Identification", result: "Complies" },
  { AnalysisType: 0, FormFieldId: "ph", DisplayLabel: "pH", SpecificationText: "4.0 – 6.0", result: "4.99" },
  { AnalysisType: 1, FormFieldId: "tymc", DisplayLabel: "Total combined mould/yeast", result: "<10" },
  { AnalysisType: 1, FormFieldId: "ecoli", DisplayLabel: "Escherichia coli", result: "Absent" },
])) ?? [];

it("numbers chemical tests, groups shared names and puts every microbial test under one last number", () => {
  const layout = certificateLayout(rows);
  expect(layout.map((entry) => [entry.number, entry.label, entry.lines.map((line) => line.label)])).toEqual([
    [1, "Description", []],
    [2, "Identification", ["Test A", "Test B"]],
    [3, "pH", []],
    [4, "Microbial", ["Total viable aerobic count", "Total combined mould/yeast", "Escherichia coli"]],
  ]);
  expect(layout[2]?.row?.result).toBe("4.99");
});

it("adds no microbial number when the certificate has no microbial tests", () => {
  const layout = certificateLayout(rows.filter((row) => row.analysisType === 0));
  expect(layout.at(-1)?.label).toBe("pH");
});
