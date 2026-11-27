import { describe, expect, it } from "vitest";
import { asAnalysis, byAnalysis, groupSections, specificationSchema, withSavedValues, type SpecificationSection } from "./specification-schema";

const section = (id: string, order: number, group: string | null = null, value: string | null = null): SpecificationSection => ({ id, name: id, description: "", value, group, order, analysis: "chemical" });

describe("specification schema", () => {
  it("reads a material specification's item and creator", () => {
    const spec = specificationSchema.parse({ id: "s1", specificationNumber: " QCD/SPC/RM/001 ", material: { id: "m1", name: "Lactose", code: "RM-1", kind: 0 }, createdBy: { firstName: "Ama", lastName: "Owusu" } });
    expect(spec.number).toBe("QCD/SPC/RM/001");
    expect(spec.item).toMatchObject({ id: "m1", name: "Lactose", kind: 0 });
    expect(spec.createdBy?.name).toBe("Ama Owusu");
    expect(spec.isVerified).toBe(false);
  });
  it("joins saved values onto the template's tests in order", () => {
    expect(withSavedValues([section("b", 2), section("a", 1)], [section("b", 0, null, "1")]).map((item) => [item.id, item.value])).toEqual([["a", null], ["b", "1"]]);
  });
  it("groups tests only when two or more share a group", () => {
    const rows = groupSections([section("a", 1, "Identity"), section("b", 2, "Identity"), section("c", 3, "Assay")]);
    expect(rows.map((row) => row.type === "group" ? `group:${row.name}:${String(row.sections.length)}` : `test:${row.section.id}`)).toEqual(["group:Identity:2", "test:c"]);
  });

  it("reads the microbial template beside the chemical one", () => {
    const spec = specificationSchema.parse({ id: "s1", form: { id: "f1", name: "Assay" }, microbialForm: { id: "f2", name: " Microbial limits " } });
    expect(spec.form).toEqual({ id: "f1", name: "Assay" });
    expect(spec.microbialForm).toEqual({ id: "f2", name: "Microbial limits" });
    expect(specificationSchema.parse({ id: "s2" }).microbialForm).toBeNull();
    expect(specificationSchema.parse({ id: "s3", microbialFormId: "f9" }).microbialForm).toEqual({ id: "f9", name: "Microbial template" });
  });

  it("splits tests by template, chemical first, leaving out an empty template", () => {
    const chemical = asAnalysis([section("assay", 1)], "chemical");
    const micro = asAnalysis([section("tamc", 1), section("tymc", 2)], "microbial");
    expect(byAnalysis([...micro, ...chemical]).map((group) => [group.label, group.sections.map((item) => item.id)]))
      .toEqual([["Chemical tests", ["assay"]], ["Microbial tests", ["tamc", "tymc"]]]);
    expect(byAnalysis(chemical).map((group) => group.analysis)).toEqual(["chemical"]);
  });
});

