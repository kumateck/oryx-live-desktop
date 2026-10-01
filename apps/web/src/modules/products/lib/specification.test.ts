import { expect, it } from "vitest";
import { savedSpecificationListSchema, specificationFormSchema } from "../schemas/specification-schema";
import { earliestRevisionDate, newSpecificationRequest, nextSpecificationNumber, specificationPrefix, updatedSpecificationRequest } from "./specification";

const now = new Date(2026, 9, 1, 15);
const day = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

it("puts the revision date after the effective date and after today", () => {
  expect(day(earliestRevisionDate(null, now))).toEqual([2026, 10, 2]);
  expect(day(earliestRevisionDate(new Date(2026, 0, 5), now))).toEqual([2026, 10, 2]);
  expect(day(earliestRevisionDate(new Date(2026, 11, 31), now))).toEqual([2027, 1, 1]);
});

it("numbers a specification by division and stage", () => {
  expect([specificationPrefix(0, 1), specificationPrefix(1, 2), specificationPrefix(1, 0), specificationPrefix(null, 1)]).toEqual(["BMP/B/SPC", "NMP/FP/SPC", "NMP/IPC/SPC", null]);
  expect(nextSpecificationNumber("NMP/FP/SPC", 9)).toBe("NMP/FP/SPC/010");
});

const far = new Date(2999, 0, 2);
const values = specificationFormSchema.parse({ specificationNumber: " NMP/FP/SPC/010 ", revisionNumber: "01", supersedesNumber: "None",
  effectiveDate: new Date(2999, 0, 1), reviewDate: far, form: { value: "f1", label: "Finished form" } });

it("refuses a revision date that is not after the effective date", () => {
  const result = specificationFormSchema.safeParse({ ...values, reviewDate: new Date(2999, 0, 1) });
  expect(result.success ? [] : result.error.issues.map((issue) => issue.path.join("."))).toEqual(["reviewDate"]);
});

it("creates for this product and stage, and updates keeping the due date and reference", () => {
  expect(newSpecificationRequest(values, { productId: "p1", stage: 2, userId: "u1", now })).toMatchObject({
    specificationNumber: "NMP/FP/SPC/010", formId: "f1", testStage: 2, productIds: ["p1"], userId: "u1", description: "", dueDate: new Date(2026, 9, 2, 15).toISOString() });
  const saved = savedSpecificationListSchema.parse([{ id: "s1", testStage: 1, dueDate: "2026-01-01T00:00:00Z", reference: "REF-1" }])[0]!;
  expect(updatedSpecificationRequest(values, saved)).toMatchObject({ testStage: 1, dueDate: "2026-01-01T00:00:00Z", reference: "REF-1", revisionNumber: "01" });
  expect(updatedSpecificationRequest(values, { ...saved, dueDate: null, reference: null })).not.toHaveProperty("dueDate");
});
