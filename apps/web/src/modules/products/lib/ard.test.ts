import { expect, it } from "vitest";
import { ardSpecificationSourceSchema, savedArdListSchema } from "../schemas/ard-schema";
import { ardStageChoices, newArdRequest, updatedArdRequest } from "./ard";

const stp = { id: "stp-1", stpNumber: "QCD/STP/FP/001" };
const specs = ardSpecificationSourceSchema.parse([
  { testStage: 1, specificationNumber: "SPEC-B", form: { id: "f-bulk", name: "Bulk form" } },
  { testStage: 2, specificationNumber: "SPEC-F", form: null },
]);
const saved = savedArdListSchema.parse([{ id: "a1", specNumber: "SPEC-B", stage: 1, analysisType: 1, coaItems: [{ name: "Assay" }], description: "d",
  form: { id: "f-bulk", name: "Bulk form" }, productStandardTestProcedure: { id: "stp-1", stpNumber: "QCD/STP/FP/001" }, attachments: null }]);

it("offers each stage without a record, and says what a stage still needs", () => {
  expect(ardStageChoices([], stp, specs).map((choice) => [choice.label, choice.source?.form.name ?? null, choice.missing])).toEqual([
    ["Bulk", "Bulk form", ""], ["Finished", null, "a template form on the finished specification"], ["Intermediate", null, "an intermediate specification"],
  ]);
  expect(ardStageChoices(saved, stp, specs).map((choice) => choice.label)).toEqual(["Finished", "Intermediate"]);
  expect(ardStageChoices([], null, specs)[0]).toMatchObject({ source: null, missing: "the product's STP" });
  expect(ardStageChoices([], null, [])[2]?.missing).toBe("the product's STP and an intermediate specification");
});

it("creates from the stage's source and updates without losing what the page does not edit", () => {
  const source = ardStageChoices([], stp, specs)[0]?.source;
  if (!source) throw new Error("no source");
  expect(newArdRequest({ specNumber: "SPEC-B", description: null }, source)).toEqual({ specNumber: "SPEC-B", description: "", stage: 1, stpId: "stp-1", formId: "f-bulk" });
  expect(updatedArdRequest({ specNumber: "SPEC-B2", description: "new" }, saved[0]!)).toEqual({
    specNumber: "SPEC-B2", description: "new", stage: 1, stpId: "stp-1", formId: "f-bulk", analysisType: 1, coaItems: [{ name: "Assay" }] });
  expect(updatedArdRequest({ specNumber: "x" }, { ...saved[0]!, form: null })).toBeNull();
});
