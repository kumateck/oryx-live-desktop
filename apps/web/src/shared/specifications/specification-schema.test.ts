import { describe, expect, it } from "vitest";
import { groupSections, specificationSchema, withSavedValues, type SpecificationSection } from "./specification-schema";

const section = (id: string, order: number, group: string | null = null, value: string | null = null): SpecificationSection => ({ id, name: id, description: "", value, group, order });

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
});
