import { expect, it } from "vitest";
import { productFormSchema, productFormSourceSchema } from "../schemas/product-form-schema";
import { toFormValues, toProductRequest, unitLabel } from "./product-form";

const valid = {
  name: " Wormee ", code: "NL-047", category: { value: "c1", label: "Syrup" }, department: { value: "d1", label: "Oral liquids" },
  division: { value: "1", label: "Non-beta-lactam" }, baseUom: { value: "u1", label: "Millilitre (ml)" }, baseQuantity: 5,
  fullBatchSize: 1_500_000, genericName: " ", equipment: null, description: "",
};

it("requires the fields the backend needs and explains each problem", () => {
  const empty = productFormSchema.safeParse({ name: "", code: "" });
  const messages = empty.success ? [] : empty.error.issues.map((issue) => issue.message);
  expect(messages).toEqual(expect.arrayContaining(["Enter the product name", "Enter the product code", "Choose a category", "Choose the base unit"]));
  // The list price is set in Finance → Costing, so the product form does not ask for it.
  expect(messages).not.toContain("Enter the price");
  expect(productFormSchema.safeParse({ ...valid, code: "undefined" }).success).toBe(false);
  expect(productFormSchema.safeParse({ ...valid, baseQuantity: 0 }).success).toBe(false);
  const tooSmall = productFormSchema.safeParse({ ...valid, fullBatchSize: 2 });
  expect(tooSmall.success ? "" : tooSmall.error.issues[0]?.message).toBe("The full batch cannot be smaller than one composition unit");
});

it("builds the request with IDs, trimmed text, and quantities as entered", () => {
  const request = toProductRequest(productFormSchema.parse(valid));
  expect(request).toMatchObject({ name: "Wormee", code: "NL-047", categoryId: "c1", departmentId: "d1", baseUomId: "u1", division: 1,
    baseQuantity: 5, fullBatchSize: 1_500_000, genericName: null, equipmentId: null, description: null });
  expect("revisionNumber" in request).toBe(false);
});

it("starts the edit form from the saved product and survives missing references", () => {
  const source = productFormSourceSchema.parse({ id: "658da105-a506-44a9-8ff5-8d005a54f294", name: "Wormee", code: "NL-047", division: 1,
    baseQuantity: 5, fullBatchSize: 1_500_000, price: 0, category: { id: "c1", name: "Syrup" }, department: null,
    equipment: { id: null, name: null }, baseUoM: { id: "u1", name: "Millilitre", symbol: "ml" }, description: null });
  const values = toFormValues(source);
  expect(values).toMatchObject({ name: "Wormee", category: { value: "c1", label: "Syrup" }, division: { value: "1", label: "Non-beta-lactam" },
    baseUom: { value: "u1", label: "Millilitre (ml)" }, fullBatchSize: 1_500_000, equipment: null, description: "" });
  // The price is not part of the form at all; a missing department is left empty for the user to fill.
  expect("price" in values).toBe(false);
  expect("department" in values).toBe(false);
  expect(unitLabel({ name: null, symbol: "kg" })).toBe("kg");
});
