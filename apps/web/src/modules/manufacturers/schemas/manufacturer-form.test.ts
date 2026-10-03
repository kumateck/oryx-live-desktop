import { expect, it } from "vitest";
import { emptyManufacturer, manufacturerFormSchema, manufacturerPayload } from "./manufacturer-form-schema";

const option = (value: string, label: string) => ({ value, label });
const base = () => ({
  ...emptyManufacturer(), name: "Build Co", address: "Tema", email: "", validityDate: new Date(2026, 8, 30),
  country: option("gh", "Ghana"),
});
const row = (materialId: string) => ({
  kind: option("0", "Raw material"), material: option(materialId, "Material"),
  quantityType: option("0", "Single"), values: "12.5000", min: null, max: null,
});

it("rejects invalid ranges, nonpositive lists, and duplicate materials", () => {
  expect(manufacturerFormSchema.safeParse({ ...base(), materials: [{ ...row("one"), values: "0" }] }).success).toBe(false);
  expect(manufacturerFormSchema.safeParse({ ...base(), materials: [{ ...row("one"), quantityType: option("1", "Range"), min: 8, max: 4 }] }).success).toBe(false);
  expect(manufacturerFormSchema.safeParse({ ...base(), materials: [row("one"), row("one")] }).success).toBe(false);
});

it("maps single, range, and list quantities without display rounding", () => {
  const values = manufacturerFormSchema.parse({ ...base(), materials: [
    row("one"), { ...row("two"), quantityType: option("1", "Range"), min: 5, max: 10, values: "" },
    { ...row("three"), quantityType: option("2", "List"), values: "4.125, 8.25" },
  ] });
  expect(manufacturerPayload(values).materials).toEqual([
    { materialId: "one", quantityType: 0, quantityPerPackOption: { type: 0, min: null, max: null, values: [12.5] } },
    { materialId: "two", quantityType: 1, quantityPerPackOption: { type: 1, min: 5, max: 10, values: [] } },
    { materialId: "three", quantityType: 2, quantityPerPackOption: { type: 2, min: null, max: null, values: [4.125, 8.25] } },
  ]);
});
