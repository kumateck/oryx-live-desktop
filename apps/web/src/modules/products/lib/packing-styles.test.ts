import { expect, it } from "vitest";
import { packingStyleFormSchema, packingStyleListSchema } from "../schemas/packing-style-schema";
import { addStyle, fromSaved, isDuplicateName, removeStyle, suggestedYield, toPackingRequest, updateStyle, withOneDefault } from "./packing-styles";

const unit = (value: string, label: string) => ({ value, label });
const values = (name: string, isDefault = false) => ({ name, isDefault, description: "", basePackingUom: unit("u-bottle", "Bottle (btl)"),
  basePackingQuantity: 100, expectedYield: 15000, packPerShipper: 24, units: [{ uom: unit("u-bottle", "Bottle (btl)"), quantity: 1 }] });
const saved = fromSaved(packingStyleListSchema.parse([
  { id: "11111111-1111-4111-8111-111111111111", name: "100 ml bottle", isDefault: true, basePackingQuantity: 100, packPerShipper: 24, expectedYield: 15000,
    basePackingUoM: { id: "u-bottle", name: "Bottle", symbol: "btl" },
    packingLists: [{ uom: { id: "u-box", name: "Box", symbol: "box" }, quantity: 24, order: 2 }, { uom: { id: "u-bottle", name: "Bottle", symbol: "btl" }, quantity: 1, order: 1 }] },
  { id: "22222222-2222-4222-8222-222222222222", name: "60 ml bottle", isDefault: false, basePackingQuantity: 60, packPerShipper: 48,
    basePackingUoM: { id: "u-bottle", name: "Bottle", symbol: "btl" }, packingLists: null },
]));

it("reads saved styles with their units in order", () => {
  expect(saved[0]).toMatchObject({ key: "11111111-1111-4111-8111-111111111111", basePackingUom: { value: "u-bottle", label: "Bottle (btl)" } });
  expect(saved[0]?.units.map((item) => item.uom.value)).toEqual(["u-bottle", "u-box"]);
  expect(saved[1]?.units).toEqual([]);
});

it("keeps exactly one default as styles are added, changed, and removed", () => {
  expect(addStyle([], values("Only"), "a").map((style) => style.isDefault)).toEqual([true]);
  const added = addStyle(saved, values("Sachet", true), "new-1");
  expect(added.map((style) => style.isDefault)).toEqual([false, false, true]);
  const moved = updateStyle(added, saved[1]?.key ?? "", { ...values("60 ml bottle"), isDefault: true });
  expect(moved.map((style) => style.isDefault)).toEqual([false, true, false]);
  // Removing the default hands it to the first remaining style.
  expect(removeStyle(moved, saved[1]?.key ?? "").map((style) => [style.name, style.isDefault])).toEqual([["100 ml bottle", true], ["Sachet", false]]);
  expect(withOneDefault([])).toEqual([]);
});

it("refuses a label another style already uses, ignoring case and the style being edited", () => {
  expect(isDuplicateName(saved, " 100 ML bottle ", null)).toBe(true);
  expect(isDuplicateName(saved, "100 ml bottle", saved[0]?.key ?? null)).toBe(false);
  expect(isDuplicateName(saved, "Sachet", null)).toBe(false);
});

it("suggests the yield from the batch size and never divides by zero", () => {
  expect(suggestedYield(1_500_000, 100)).toBe(15000);
  expect(suggestedYield(1_500_000, 0)).toBeNull();
  expect(suggestedYield(null, 100)).toBeNull();
});

it("sends saved styles with their ID so a rename updates instead of replacing", () => {
  const renamed = updateStyle(addStyle(saved, values("Sachet"), "new-1"), saved[0]?.key ?? "", { ...values("100 ml amber bottle"), isDefault: true });
  const request = toPackingRequest(renamed);
  expect(request[0]).toMatchObject({ id: "11111111-1111-4111-8111-111111111111", name: "100 ml amber bottle", basePackingUomId: "u-bottle", isDefault: true });
  expect(request[0]?.packingLists).toEqual([{ uomId: "u-bottle", quantity: 1, order: 1 }]);
  expect("id" in (request[2] ?? {})).toBe(false);
});

it("validates a style: units required, positive quantities, no repeated unit", () => {
  expect(packingStyleFormSchema.safeParse(values("Ok")).success).toBe(true);
  const none = packingStyleFormSchema.safeParse({ ...values("x"), units: [] });
  expect(none.success ? "" : none.error.issues[0]?.message).toBe("Add at least one packing unit");
  const repeated = packingStyleFormSchema.safeParse({ ...values("x"), units: [{ uom: unit("u", "U"), quantity: 1 }, { uom: unit("u", "U"), quantity: 2 }] });
  expect(repeated.success ? "" : repeated.error.issues[0]?.message).toBe("This unit is already listed");
  expect(packingStyleFormSchema.safeParse({ ...values("x"), basePackingQuantity: 0 }).success).toBe(false);
});
