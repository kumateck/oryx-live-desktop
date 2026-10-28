import { describe, expect, it } from "vitest";
import { ardRecordSchema, keptFields } from "./ard-record";

describe("ard records", () => {
  it("reads a material record's STP and item and keeps what the page does not edit", () => {
    const record = ardRecordSchema.parse({ id: "a1", specNumber: "QCD/SPC/RM/001", analysisType: 1, coaItems: [{ formFieldId: "f1" }], uniformityOfWeight: { id: "u1" },
      materialStandardTestProcedure: { id: "t1", stpNumber: "QCD/STP/RM/001", material: { id: "m1", name: "Lactose", code: "RM-1" } }, form: { id: "f1", name: "Lactose ARD" } });
    expect(record.stp).toEqual({ id: "t1", number: "QCD/STP/RM/001", item: { id: "m1", name: "Lactose", code: "RM-1" } });
    expect(keptFields(record)).toEqual({ analysisType: 1, coaItems: [{ formFieldId: "f1" }], uniformityOfWeightId: "u1" });
  });
  it("sends nothing extra for a plain product record", () => {
    const record = ardRecordSchema.parse({ id: "a2", stage: 2, productStandardTestProcedure: { id: "t2", stpNumber: "QCD/STP/FP/002", product: { id: "p1", name: "Amoxil" } } });
    expect(record.item?.name).toBe("Amoxil");
    expect(record.stage).toBe(2);
    expect(keptFields(record)).toEqual({});
  });
});
