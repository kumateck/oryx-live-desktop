import { describe, expect, it } from "vitest";
import { coaItemsFor, coaProblems } from "./coa-items";

const form = { sections: [{ groupName: "Microbiology", description: "<p>Absent</p>", fields: [{ id: "f1", question: { label: "E. coli", reference: "BP" } }, { id: "f2", description: "Count" }] }] };
describe("certificate rows", () => {
  it("makes one row per field, prefilled from the test for microbial ARDs", () => {
    expect(coaItemsFor(form, true)).toEqual([
      { formFieldId: "f1", includeOnCoa: false, displayLabel: "E. coli", groupName: "Microbiology", specificationText: "<p>Absent</p>", unit: "", reference: "BP", displayOrder: 0 },
      { formFieldId: "f2", includeOnCoa: false, displayLabel: "Count", groupName: "Microbiology", specificationText: "<p>Absent</p>", unit: "", reference: "", displayOrder: 1 },
    ]);
    expect(coaItemsFor(form, false)[0]).toMatchObject({ groupName: "", specificationText: "", reference: "" });
  });
  it("flags the chosen row that is incomplete, at its own position", () => {
    const items = coaItemsFor(form, false).map((item, index) => ({ ...item, includeOnCoa: index === 1 }));
    expect(coaProblems(items).rows.get(1)).toMatch(/label and specification/);
    expect(coaProblems(items).rows.has(0)).toBe(false);
    expect(coaProblems(coaItemsFor(form, false)).overall).toMatch(/at least one/);
  });
});
