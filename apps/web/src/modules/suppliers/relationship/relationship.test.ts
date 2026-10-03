import { expect, it } from "vitest";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { materialChoices } from "./material-choices";
import { responseSchemas } from "./response-schemas";
import { certificationSchema, pricingSchema } from "./schemas";

it("deduplicates supplier material and UoM choices and excludes incomplete links", () => {
  const link = { material: { id: "mat-1", name: "Active", code: "A" }, uoM: { id: "uom-1", name: "Kilogram", symbol: "kg" } };
  expect(materialChoices([link, link, { material: { id: "mat-2", name: "No unit" } }])).toEqual([
    { key: "mat-1:uom-1", materialId: "mat-1", materialName: "Active", uomId: "uom-1", uomName: "Kilogram", uomSymbol: "kg" },
  ]);
});

it("serializes local calendar selections to stable UTC day boundaries", () => {
  const date = new Date(2026, 8, 30, 12);
  expect(utcBoundary(date)).toBe("2026-09-30T00:00:00.000Z");
  expect(utcBoundary(date, true)).toBe("2026-09-30T23:59:59.000Z");
  expect(formDate("2026-09-30T00:00:00Z")?.getDate()).toBe(30);
});

it("validates handwritten SRM response contracts at the network boundary", () => {
  expect(responseSchemas.contact.safeParse([{ id: "c1", supplierId: "s1", name: "Ada", isPrimary: true }]).success).toBe(true);
  expect(responseSchemas.contact.safeParse([{ id: "c1", supplierId: "s1", name: "Ada", isPrimary: "yes" }]).success).toBe(false);
  expect(responseSchemas.pricing.safeParse([{ id: "p1", status: 99 }]).success).toBe(false);
});

it("requires deliberate certification expiry and valid pricing dates", () => {
  const base = { certificationType: { value: "0", label: "GMP" }, certificateNumber: "GMP-1",
    issuingBody: "Agency", issueDate: new Date(2026, 0, 1), expiryDate: null };
  expect(certificationSchema.safeParse(base).success).toBe(false);
  expect(certificationSchema.safeParse({ ...base, expiryDate: new Date(2027, 0, 1) }).success).toBe(true);
  const pricing = { material: { value: "m1:u1", label: "Material" }, currency: { value: "c1", label: "GHS" },
    agreedPrice: 2, priceUoM: "kg", effectiveFrom: new Date(2026, 5, 1), effectiveTo: new Date(2026, 4, 1), notes: "" };
  expect(pricingSchema.safeParse(pricing).success).toBe(false);
});
