import { describe, expect, it } from "vitest";
import { microbialSlotOf } from "./microbial-slot";

describe("microbial slot", () => {
  it("reads the specification's microbial template and number", () => {
    expect(microbialSlotOf({ specificationNumber: " QCD/SPC/RM/010 ", microbialFormId: "f2", microbialForm: { id: "f2", name: "Micro limits" } }))
      .toEqual({ form: { id: "f2", name: "Micro limits" }, specNumber: "QCD/SPC/RM/010" });
  });
  it("is empty when the specification names no microbial template", () => {
    expect(microbialSlotOf({ specificationNumber: "QCD/SPC/RM/010" })).toBeNull();
    expect(microbialSlotOf(null)).toBeNull();
  });
  it("falls back to the id when the template is not expanded", () => {
    expect(microbialSlotOf({ microbialFormId: "f3" })).toEqual({ form: { id: "f3", name: "Microbial template" }, specNumber: null });
  });
});
