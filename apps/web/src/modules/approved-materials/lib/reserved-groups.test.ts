import { expect, it } from "vitest";
import { reservedRowsSchema } from "../schemas/approved-material-schema";
import { groupReservedProducts } from "./reserved-groups";

const rows = (entries: object[]) => reservedRowsSchema.parse(entries);
const allocation = (quantity: number, extra: object = {}) => ({ productCode: "NT-015", productName: "Lufart Tablet", productBatchNumber: "T015K051",
  schedule: "PS007", reservedQuantity: quantity, uomSymbol: "kg", ...extra });

it("groups products and production batches, summing split material lots exactly once", () => {
  const products = groupReservedProducts(rows([allocation(9.6, { materialBatchNumber: "LF-E-26133" }),
    allocation(110.4, { materialBatchNumber: "LF-E-26138" }), allocation(120, { productBatchNumber: "T015K052" }),
    allocation(120, { productBatchNumber: "T015K053" }), allocation(14.4, { productCode: "ND-003", productName: "Lufart Dry Powder" })]));
  expect(products).toHaveLength(2);
  expect(products[0]?.totals).toEqual([{ key: "mg", quantity: 360_000_000, unit: "mg" }]);
  expect(products[0]?.batches).toHaveLength(3);
  expect(products[0]?.batches[0]?.rows).toHaveLength(2);
  expect(products[0]?.batches[0]?.totals).toEqual([{ key: "mg", quantity: 120_000_000, unit: "mg" }]);
});

it("normalizes compatible units and keeps different families and unknown units separate", () => {
  const [product] = groupReservedProducts(rows([allocation(1), allocation(500, { uomSymbol: "g" }), allocation(2, { uomSymbol: "L" }),
    allocation(3, { uomSymbol: "pcs" }), allocation(4, { uomSymbol: null }), allocation(5, { uomSymbol: null })]));
  expect(product?.totals.map(total => [total.quantity, total.unit])).toEqual([[1_500_000, "mg"], [2000, "ml"], [3, "pcs"], [4, null], [5, null]]);
});

it("keeps identically named products with different codes and unknown products distinct", () => {
  const products = groupReservedProducts(rows([allocation(1, { productCode: "A" }), allocation(2, { productCode: "B" }),
    allocation(3, { productCode: null, productName: null }), allocation(4, { productCode: null, productName: null })]));
  expect(products).toHaveLength(4);
});

it("keeps different schedules and unrecorded production batches distinct", () => {
  const [product] = groupReservedProducts(rows([allocation(1), allocation(2, { schedule: "PS008" }),
    allocation(3, { productBatchNumber: null }), allocation(4, { productBatchNumber: null })]));
  expect(product?.batches).toHaveLength(4);
});

it("totals the complete response rather than one page of allocation rows", () => {
  const [product] = groupReservedProducts(rows(Array.from({ length: 47 }, () => allocation(1))));
  expect(product?.totals[0]?.quantity).toBe(47_000_000);
  expect(product?.batches[0]?.rows).toHaveLength(47);
});
