import { describe, expect, it } from "vitest";
import { documentReference, earliestRevisionDate, linkDelta, materialSpecificationPrefix, productSpecificationPrefix, serialNumber } from "./specification-rules";

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
});
