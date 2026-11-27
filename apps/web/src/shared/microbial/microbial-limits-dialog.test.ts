import { describe, expect, it } from "vitest";
import { limitsRequest } from "./microbial-limits-dialog";

const fields = [
  { formFieldId: "tamc", sectionName: "TAMC", questionLabel: "Result", questionType: 19, unit: "cfu/g" },
  { formFieldId: "coli", sectionName: "E. coli", questionLabel: "Growth", questionType: 20, unit: null },
];
const draft = { on: true, value: "1000", organism: "escherichia-coli", quantity: "1", quantityUnit: "g" };

describe("microbial limits request", () => {
  it("sends a count limit in the field's unit and an absence limit with its organism", () => {
    expect(limitsRequest(fields, { tamc: draft, coli: draft })).toEqual({ limits: [
      { formFieldId: "tamc", kind: 0, value: 1000, unit: "cfu/g", organism: null, quantity: null, quantityUnit: null },
      { formFieldId: "coli", kind: 1, value: null, unit: null, organism: "escherichia-coli", quantity: 1, quantityUnit: "g" },
    ] });
  });
  it("leaves out fields without a limit and refuses unreadable numbers", () => {
    expect(limitsRequest(fields, { tamc: { ...draft, on: false }, coli: { ...draft, on: false } })).toEqual({ limits: [] });
    expect(limitsRequest(fields, { tamc: { ...draft, value: "" } })).toHaveProperty("error");
    expect(limitsRequest(fields, { coli: { ...draft, quantity: "0" } })).toHaveProperty("error");
  });
});
