import { expect, it } from "vitest";
import { chooseCollection, collectionEditReason, collections } from "./collections";
import { itemDefaults, itemPayload, itemSchema } from "../schemas/collection-schema";
import { unitDefaults, unitFormSchema, unitPayload, unitRecordSchema } from "../schemas/unit-schema";

function definition(id: string) {
  const item = collections.find((collection) => collection.id === id);
  if (!item) throw new Error(`Missing collection ${id}`);
  return item;
}

it("defines every existing collection with its exact independent permissions", () => {
  expect(collections).toHaveLength(18);
  expect(new Set(collections.map((item) => item.id)).size).toBe(18);
  for (const item of collections) for (const key of Object.values(item.permissions)) expect(key).toMatch(/^Can/);
  const visible = [definition("payment-terms")];
  expect(chooseCollection(visible, null)?.id).toBe("payment-terms");
  expect(chooseCollection(visible, "payment-terms")?.id).toBe("payment-terms");
  expect(chooseCollection(visible, "product-categories")).toBeNull();
  expect(chooseCollection([], null)).toBeNull();
});

it("validates names, duplicate edits, and actual collection length limits", () => {
  const row = { id: "one", name: "Active ingredient" };
  const values = { ...itemDefaults(), name: " active INGREDIENT " };
  expect(itemSchema(definition("raw-categories"), [row]).safeParse(values).success).toBe(false);
  expect(itemSchema(definition("raw-categories"), [row], "one").safeParse(values).success).toBe(true);
  expect(itemSchema(definition("sites"), []).safeParse({ ...values, name: "a".repeat(101) }).success).toBe(false);
  expect(itemSchema(definition("charges"), []).safeParse({ ...values, description: "a".repeat(101) }).success).toBe(false);
  expect(itemSchema(definition("operations"), []).safeParse({ ...values, name: "  " }).success).toBe(false);
});

it("keeps raw and packaging categories distinct in create and edit payloads", () => {
  const values = { ...itemDefaults(), name: " Tablets ", description: " Solid forms " };
  expect(itemPayload(definition("raw-categories"), values)).toEqual({ name: "Tablets", description: "Solid forms", materialKind: 0 });
  expect(itemPayload(definition("package-categories"), values)).toEqual({ name: "Tablets", description: "Solid forms", materialKind: 1 });
});

it("validates resource and payment fields without allowing destructive partial edits", () => {
  const values = { ...itemDefaults(), name: "Mixer", resourceType: " Machine " };
  expect(itemPayload(definition("resources"), values)).toEqual({ name: "Mixer", type: "Machine", isAvailable: true });
  expect(itemSchema(definition("resources"), []).safeParse({ ...values, resourceType: "" }).success).toBe(false);
  const payment = definition("payment-terms");
  for (const dueDays of [null, 0, 30]) expect(itemSchema(payment, []).safeParse({ ...values, dueDays }).success).toBe(true);
  for (const dueDays of [-1, 0.5, 2147483648]) expect(itemSchema(payment, []).safeParse({ ...values, dueDays }).success).toBe(false);
  expect(itemPayload(payment, { ...values, dueDays: 0 })).toEqual({ name: "Mixer", description: "", dueDays: 0 });
  expect(collectionEditReason(payment)).toContain("due days");
  expect(collectionEditReason(definition("resources"))).toContain("availability");
  expect(collectionEditReason(definition("operations"))).toBeNull();
});

it("requires unit classifications and preserves every field from a full unit read", () => {
  const record = unitRecordSchema.parse({ id: "u1", name: "Surface", symbol: "m²", description: "Area unit", isScalable: true, type: 3, category: 4 });
  expect(unitFormSchema.safeParse(unitDefaults()).success).toBe(false);
  expect(unitPayload(unitFormSchema.parse(unitDefaults(record)))).toEqual({
    name: "Surface", symbol: "m²", description: "Area unit", isScalable: true, type: 3, category: 4,
  });
  expect(unitRecordSchema.safeParse({ id: "u1", name: "Partial", symbol: "p" }).success).toBe(false);
});
