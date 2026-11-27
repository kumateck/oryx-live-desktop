import { describe, expect, it } from "vitest";
import { z } from "zod";
import { checkRevisionDate, documentReference, earliestRevisionDate, linkDelta, materialSpecificationPrefix, productSpecificationPrefix, serialNumber, specificationBaseSchema, specificationBody, specificationDefaults } from "./specification-rules";

describe("specification rules", () => {
  it("reads back the pharmacopoeia without its year", () => { expect(documentReference("In House 2024")).toEqual({ value: "In House", label: "In House" }); expect(documentReference("")).toBeNull(); });
  it("puts the revision date after the effective date and today", () => {
    const now = new Date(2026, 9, 15);
    expect(earliestRevisionDate(null, now)).toEqual(new Date(2026, 9, 16));
    expect(earliestRevisionDate(new Date(2026, 11, 1), now)).toEqual(new Date(2026, 11, 2));
  });
  it("numbers specifications and works out the linked-item changes", () => {
    expect(serialNumber(materialSpecificationPrefix(1), 7)).toBe("QCD/SPC/PM/007");
    expect(productSpecificationPrefix(0, 2)).toBe("BMP/FP/SPC");
    expect(productSpecificationPrefix(1, 1)).toBe("NMP/B/SPC");
    expect(productSpecificationPrefix(null, 0)).toBeNull();
    expect(linkDelta(["a", "b"], ["b", "c"])).toEqual({ add: ["c"], remove: ["a"] });
  });
  it("sends the microbial template, or null when there is none", () => {
    const values = { specificationNumber: "QCD/SPC/RM/001", revisionNumber: "01", supersedesNumber: "None", effectiveDate: new Date(2026, 10, 1), reviewDate: new Date(2029, 10, 1),
      form: { value: "f1", label: "Assay" }, reference: null, description: "" };
    expect(specificationBody({ ...values, microbialForm: { value: "f2", label: "Micro" } }).microbialFormId).toBe("f2");
    expect(specificationBody(values).microbialFormId).toBeNull();
    expect(specificationDefaults({ specificationNumber: null, revisionNumber: null, supersedesNumber: null, effectiveDate: null, reviewDate: null, form: null,
      microbialForm: { id: "f2", name: "Micro" }, reference: null, description: null }).microbialForm).toEqual({ value: "f2", label: "Micro" });
  });
  it("refuses the chemical template in the microbial slot", () => {
    const schema = specificationBaseSchema.superRefine(checkRevisionDate);
    const base = { specificationNumber: "S", revisionNumber: "01", supersedesNumber: "None", effectiveDate: new Date(2099, 0, 1), reviewDate: new Date(2099, 5, 1), form: { value: "f1", label: "Assay" } };
    const same = schema.safeParse({ ...base, microbialForm: { value: "f1", label: "Assay" } });
    expect(same.success).toBe(false);
    expect(z.flattenError(same.error!).fieldErrors).toHaveProperty("microbialForm");
    expect(schema.safeParse({ ...base, microbialForm: { value: "f2", label: "Micro" } }).success).toBe(true);
  });
});

