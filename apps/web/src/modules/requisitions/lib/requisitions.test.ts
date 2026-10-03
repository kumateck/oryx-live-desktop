import { expect, it } from "vitest";
import { openLines, reviewSourcing, sourcingBlock, sourcingRequest } from "../../sourcing/lib/sourcing";
import { pickRowsSchema, requisitionRowsSchema, requisitionSchema } from "../schemas/requisition-schema";
import { newOrderLine, orderLineProblems, shortOfMaximum, toRequisitionItems } from "./order-lines";
import { statusLabel } from "./requisition-status";
import { pipelineSchema, warehouseStockSchema } from "../schemas/stock-schema";
import { sourceProblems, stockTransferRequest } from "./stock-transfer";

const [starch, film] = pickRowsSchema.parse([
  { material: { id: "m1", code: "RM-001", name: "Maize starch", totalStock: 9_000_000, materialCategory: { name: "Excipient" } }, uoM: { id: "u-mg", symbol: "mg" },
    warehouseStock: 4_000_000, reOrderLevel: 5_000_000, minimumStockLevel: 2_000_000, maximumStockLevel: 20_000_000 },
  { material: { id: "m2", code: "PM-001", name: "Blister film", totalStock: 10 }, uoM: { id: "u-pcs", symbol: "pcs" }, warehouseStock: 40 },
  { material: { name: "no id" } },
]);
if (!starch || !film) throw new Error("fixtures");

it("reads a material's stock position, never showing other departments' stock as negative", () => {
  expect(starch).toMatchObject({ id: "m1", category: "Excipient", stock: 4_000_000, elsewhere: 5_000_000, reorder: 5_000_000 });
  expect(film.elsewhere).toBe(0);
});

it("takes order quantities in the largest unit and stores them in the material's own unit", () => {
  const line = newOrderLine(starch);
  expect(line.enteredUnit).toBe("kg");
  expect(shortOfMaximum(line)).toBe(16);
  expect(shortOfMaximum(newOrderLine(film))).toBeNull();
  expect(orderLineProblems([line, { ...newOrderLine(film), quantity: 0 }]).map((problem) => problem.id)).toEqual(["m1", "m2"]);
  expect(orderLineProblems([{ ...line, unitId: null, quantity: 5 }])[0]?.message).toContain("no unit of measure");
  const lines = [{ ...line, quantity: 2.5 }, { ...line, id: "m3", quantity: 500, enteredUnit: "g" }, { ...newOrderLine(film), quantity: 12 }];
  expect(orderLineProblems(lines)).toEqual([]);
  expect(toRequisitionItems(lines)).toEqual([{ materialId: "m1", quantity: 2_500_000, uomId: "u-mg" }, { materialId: "m3", quantity: 500_000, uomId: "u-mg" }, { materialId: "m2", quantity: 12, uomId: "u-pcs" }]);
});

it("names a status for what the requisition is waiting on", () => {
  expect(statusLabel(0, 1)).toBe("Awaiting approval");
  expect(statusLabel(1, 1)).toBe("Awaiting sourcing");
  expect(statusLabel(1, 0)).toBe("Awaiting issue");
  expect(statusLabel(4, 1)).toBe("Rejected");
});

const item = (id: string, status: number) => ({ id, quantity: 2_500_000, status, material: { id: `m-${id}`, code: `RM-${id}`, name: `Material ${id}` }, uoM: { id: "u-mg", symbol: "mg" } });
const approved = requisitionSchema.parse({ id: "r1", code: "PR-0001", requisitionType: 1, status: 1, approved: true, items: [item("a", 1), item("b", 1), item("c", 2)] });

it("leaves out of a page a requisition it cannot read, instead of failing the page", () => {
  expect(requisitionRowsSchema.parse([{ id: "r1", code: "PR-0001" }, { code: "no id" }]).map((row) => row.code)).toEqual(["PR-0001"]);
});

it("sources only approved purchase requisitions, and only lines not already sent to suppliers", () => {
  expect(sourcingBlock(approved)).toBeNull();
  expect(openLines(approved).map((line) => line.id)).toEqual(["a", "b"]);
  expect(sourcingBlock({ ...approved, approved: false })).toContain("awaiting approval");
  expect(sourcingBlock({ ...approved, type: 0 })).toContain("not a purchase requisition");
  expect(sourcingBlock(requisitionSchema.parse({ id: "r2", requisitionType: 1, status: 2, approved: true, items: [item("c", 2)] }))).toContain("already has its suppliers");
});

it("sorts lines into ready, left for later and half filled in, and sends quantities as stored", () => {
  const lines = openLines(approved);
  const choices = { a: { source: 0 as const, suppliers: ["s1", "s2"] }, b: { source: 1 as const, suppliers: [] } };
  const review = reviewSourcing(lines, choices);
  expect(review.ready.map((line) => line.id)).toEqual(["a"]);
  expect(review.problems).toEqual([{ lineId: "b", message: "Choose at least one supplier for Material b" }]);
  expect(reviewSourcing(lines, { a: choices.a }).untouched.map((line) => line.id)).toEqual(["b"]);
  expect(sourcingRequest("r1", review.ready, choices)).toEqual({ requisitionId: "r1", items: [
    { materialId: "m-a", uoMId: "u-mg", quantity: 2_500_000, source: 0, suppliers: [{ supplierId: "s1" }, { supplierId: "s2" }] }] });
});

it("reads stock held elsewhere, keeping expired stock out of what is usable", () => {
  expect(warehouseStockSchema.parse([{ warehouse: { id: "w1", name: "Raw store", type: 0 }, stockQuantity: 9_000_000, expiredQuantity: 1_000_000 }, { warehouse: { id: "w2", name: "Floor 1", type: 3 }, stockQuantity: 500, expiredQuantity: 900 }]))
    .toEqual([{ id: "w1", name: "Raw store", onFloor: false, total: 9_000_000, expired: 1_000_000, usable: 8_000_000 }, { id: "w2", name: "Floor 1", onFloor: true, total: 500, expired: 900, usable: 0 }]);
  expect(pipelineSchema.parse([{ id: "po1", reference: "PO-9", stage: 3, route: 0, quantity: 5, uom: { symbol: "kg" } }, { stage: 99 }]).map((row) => [row.stage, row.route])).toEqual([["Purchase order", "Foreign"], ["In the pipeline", null]]);
});

it("asks each department once, in the material's own unit, with the total it adds up to", () => {
  const material = { id: "m1", name: "Maize starch", code: "RM-001", unit: "mg", unitId: "u-mg", stock: 0, elsewhere: 9_000_000 };
  const kg = { value: "kg", label: "kg" };
  const sources = [{ quantity: 2, unit: kg, department: { value: "d1", label: "Stores" } }, { quantity: 500, unit: { value: "g", label: "g" }, department: { value: "d2", label: "R&D" } }];
  expect(sourceProblems(sources)).toEqual([]);
  expect(sourceProblems([...sources, { quantity: 1, unit: kg, department: { value: "d1", label: "Stores" } }])).toEqual([{ index: 2, message: "This department is already on the request" }]);
  expect(stockTransferRequest(material, { code: "ST-1", reason: "Campaign", sources })).toEqual({ code: "ST-1", materialId: "m1", uoMId: "u-mg", reason: "Campaign", requiredQuantity: 2_500_000,
    sources: [{ fromDepartmentId: "d1", quantity: 2_000_000 }, { fromDepartmentId: "d2", quantity: 500_000 }] });
});
