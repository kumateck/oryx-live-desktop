import { expect, it } from "vitest";
import { purchaseOrderSchema } from "../../proforma-requests/schemas/purchase-order-schema";
import { chargesSchema } from "../schemas/order-form-schema";
import { finaliseRequest, grandTotal } from "./order-totals";
import { changeText, lineChanges, revisionProblems, revisionRequest, startDrafts } from "./revision-draft";
import { awardLine, reassignBlock, reassignCandidates, takeLineOff } from "./line-moves";
import { describeChange, revisionKind } from "./revisions";
import { comparisonSchema } from "../../price-comparison/schemas/comparison-schema";

it("totals a foreign order with insurance and freight, and a local one with tax", () => {
  expect(grandTotal(0, 12_000, { insurance: 150.5, freight: 800, tax: 99 })).toBe(12_950.5);
  expect(grandTotal(1, 12_000, { insurance: 150.5, freight: 800, tax: 99 })).toBe(12_099);
  expect(grandTotal(1, 0.1, { insurance: null, freight: null, tax: 0.2 })).toBe(0.3);
});

it("finalises an order with a total and words worked out, keeping tax in the server's freight field", () => {
  expect(finaliseRequest(0, 12_000, { insurance: 150.5, freight: 800, tax: null }, "US Dollar")).toEqual({ totalFobValue: 12_000, totalCifValue: 12_950.5, seaFreight: 800, insurance: 150.5,
    amountInFigures: "Twelve thousand nine hundred and fifty US Dollar and 50/100" });
  expect(finaliseRequest(1, 400, { insurance: 9, freight: 9, tax: 60 }, "Ghana Cedi")).toEqual({ totalFobValue: 400, totalCifValue: 460, seaFreight: 60, insurance: 0, amountInFigures: "Four hundred and sixty Ghana Cedi only" });
  expect(finaliseRequest(1, 400, { insurance: null, freight: null, tax: null }, null).totalCifValue).toBe(400);
});

it("requires insurance and freight on a foreign order, and only refuses a negative tax on a local one", () => {
  const problems = (type: 0 | 1, values: object) => chargesSchema(type).safeParse(values).error?.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) ?? [];
  expect(problems(0, { insurance: 150, freight: 800 })).toEqual([]);
  expect(problems(0, { insurance: Number.NaN, freight: 0 })).toEqual(["insurance: Enter the insurance", "freight: The freight must be above zero"]);
  expect(problems(0, { insurance: null, freight: 0 })).toEqual(["insurance: Enter the insurance", "freight: The freight must be above zero"]);
  expect(problems(1, {})).toEqual([]);
  // An empty number field reports "not a number"; an optional tax left empty is simply no tax.
  expect(problems(1, { tax: Number.NaN })).toEqual([]);
  expect(problems(1, { tax: -1 })).toEqual(["tax: Tax cannot be negative"]);
});

it("reads an order's recorded totals and its revision history", () => {
  const order = purchaseOrderSchema.parse({ id: "po1", code: "PO-9", status: 7, supplier: { id: "s1", name: "Acme", type: 0, currency: { symbol: "$", name: "US Dollar" } }, totalFobValue: 300, totalCifValue: 450, seaFreight: 100, insurance: 50,
    amountInFigures: "Four hundred and fifty US Dollar only", isRevised: true, revisionNumber: 1, attachments: [{ id: "f1", name: "pfi.pdf", link: "https://files.test/pfi.pdf" }],
    items: [{ id: "l1", quantity: 25_000_000, price: 12, priceUoM: "kg", uom: { symbol: "mg" }, material: { name: "Maize starch" } }],
    revisions: [{ revisionNumber: 1, items: [{ type: 3, material: { name: "Maize starch" }, quantity: 25_000_000, quantityBefore: 20_000_000, price: 12, priceBefore: 11, priceUoM: "kg", priceUoMBefore: "kg", uoM: { symbol: "mg" }, revisionDate: "2026-09-28T00:00:00Z" }] }] });
  expect(order?.recorded).toEqual({ value: 300, grandTotal: 450, freightOrTax: 100, insurance: 50, inWords: "Four hundred and fifty US Dollar only" });
  expect(order?.supplier.type).toBe(0);
  const change = order?.revisions[0]?.changes[0];
  expect(revisionKind(change?.type ?? -1)).toBe("Line changed");
  expect(describeChange(change!, "$")).toEqual({ before: "20 kg at $ 11 / kg", after: "25 kg at $ 12 / kg" });
  expect(revisionKind(42)).toBe("Changed");
  expect(purchaseOrderSchema.parse({ code: "no id", supplier: null })).toBeNull();
});

const sent = purchaseOrderSchema.parse({ id: "po1", code: "PO-9", status: 7, supplier: { id: "s1", name: "Acme", type: 0, currency: { symbol: "$" } }, items: [
  { id: "l1", quantity: 25_000_000, price: 12, priceUoM: "kg", uom: { id: "u-mg", symbol: "mg" }, currency: { id: "c-usd" }, material: { name: "Maize starch" } },
  { id: "l2", quantity: 40, price: 2.5, priceUoM: "pcs", uom: { id: "u-pcs", symbol: "pcs" }, material: { name: "Blister film" } }] });
if (!sent) throw new Error("fixture");

it("revises only the lines that really changed, in the unit each is stored in", () => {
  const drafts = startDrafts(sent);
  expect(drafts.l1).toEqual({ quantity: 25, unit: "kg", price: 12, priceUnit: "kg", removed: false });
  expect(lineChanges(sent, drafts)).toEqual([]);
  expect(revisionProblems(sent, drafts)).toEqual([{ lineId: null, message: "Nothing has been changed" }]);
  const changed = { ...drafts, l1: { ...drafts.l1!, quantity: 30, price: 11.5 }, l2: { ...drafts.l2!, removed: true } };
  const changes = lineChanges(sent, changed);
  expect(revisionProblems(sent, changed)).toEqual([]);
  expect(revisionRequest(changes, "c-usd")).toEqual([{ type: 3, purchaseOrderItemId: "l1", uoMId: "u-mg", quantity: 30_000_000, price: 11.5, priceUoM: "kg", currencyId: "c-usd" }, { type: 4, purchaseOrderItemId: "l2" }]);
  expect(changes.map((change) => changeText(change, "$"))).toEqual(["Maize starch: 30 kg at $ 11.5 / kg", "Blister film: removed from the order"]);
});

it("refuses a revision that empties the order or leaves a line without a quantity or price", () => {
  const drafts = startDrafts(sent);
  expect(revisionProblems(sent, { l1: { ...drafts.l1!, removed: true }, l2: { ...drafts.l2!, removed: true } })).toEqual([{ lineId: null, message: "At least one line has to stay on the order" }]);
  expect(revisionProblems(sent, { ...drafts, l1: { ...drafts.l1!, quantity: 0 } })[0]?.message).toBe("Enter a quantity above zero for Maize starch, or remove the line");
  expect(revisionProblems(sent, { ...drafts, l1: { ...drafts.l1!, price: null } })[0]?.message).toBe("Enter a price above zero for Maize starch");
});

it("adds a line the supplier supplies, in the supplier's currency", () => {
  const added = [{ id: "new-m9", materialId: "m9", materialName: "Lactose", unit: "kg", unitId: "u-kg", quantity: 50, price: 3, priceUnit: "kg" }];
  const changes = lineChanges(sent, startDrafts(sent), added);
  expect(revisionProblems(sent, startDrafts(sent), added)).toEqual([]);
  expect(revisionRequest(changes, "c-usd")).toEqual([{ type: 2, materialId: "m9", uoMId: "u-kg", quantity: 50, price: 3, priceUoM: "kg", currencyId: "c-usd" }]);
  expect(changeText(changes[0]!, "$")).toBe("Lactose: added, 50 kg at $ 3 / kg");
});

it("moves a line to another supplier only when one quoted and no comparison is open", () => {
  const quote = (supplier: string, price: number | null, unit: string | null) => ({ supplier: { id: supplier, name: supplier, currency: { id: "c-usd", symbol: "$" } }, sourceRequisition: { id: `sr-${supplier}` }, price, priceUoM: unit });
  const line = { ...sent.items[0]!, materialId: "m1" };
  const groups = comparisonSchema.parse([{ material: { id: "m1", name: "Maize starch" }, uoM: { id: "u-mg", symbol: "mg" }, quantity: 25_000_000, supplierQuotation: [quote("s1", 12, "kg"), quote("s2", 11, "kg"), quote("s3", 9, null)] }]);
  // The order's own supplier and a quote without a price unit are not choices.
  const candidates = reassignCandidates(groups, line, sent);
  expect(candidates.map((item) => item.supplierId)).toEqual(["s2"]);
  expect(reassignBlock(line, [], candidates)).toBeNull();
  expect(reassignBlock(line, groups, candidates)).toContain("A price comparison is open");
  expect(reassignBlock(line, [], [])).toContain("No other supplier quoted");
  expect(takeLineOff(0, line)).toEqual([{ type: 0, purchaseOrderItemId: "l1" }]);
  expect(takeLineOff(1, line)).toEqual([{ type: 1, purchaseOrderItemId: "l1" }]);
  expect(awardLine(line, candidates[0]!)).toEqual([{ supplierId: "s2", sourceRequisitionId: "sr-s2", items: [{ materialId: "m1", uomId: "u-mg", quantity: 25_000_000, price: 11, priceUoM: "kg", currencyId: "c-usd" }] }]);
});
