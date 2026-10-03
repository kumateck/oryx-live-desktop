import { expect, it } from "vitest";
import { chosenQuote, lowestQuotes, purchaseOrderDrafts, quoteBlock, quoteCost, undecided } from "../../price-comparison/lib/comparison";
import { comparisonSchema } from "../../price-comparison/schemas/comparison-schema";
import { purchaseOrderRowsSchema } from "../../proforma-requests/schemas/purchase-order-schema";
import { sendBlock } from "../../quotation-requests/lib/quotation-request-access";
import type { PricingAgreement } from "../../suppliers/relationship/types";
import { supplierQuotationRowsSchema } from "../schemas/quotation-response-schema";
import { activeAgreement, agreementChanges, agreementProposal } from "./agreements";
import { correctableLineIds, hasCorrections } from "./open-lines";
import { negligibleLines, priceLineProblems, startPriceLines, toQuotationResponse } from "./price-lines";

const now = new Date("2026-10-01T10:00:00Z");
const agreement = (over: Partial<PricingAgreement>): PricingAgreement => ({ id: "a1", supplierId: "s1", status: 1, changeKind: 0, materialId: "m1", materialName: "Maize starch", uoMId: "u-mg", uoMName: "mg",
  agreedPrice: 10, priceUoM: "kg", currency: { id: "c-usd", name: "US Dollar", symbol: "$" }, effectiveFrom: "2026-01-01T00:00:00Z", effectiveTo: "2026-12-31T00:00:00Z", notes: null, ...over });
const agreements = [agreement({}), agreement({ id: "old", agreedPrice: 8, effectiveFrom: "2025-01-01T00:00:00Z", effectiveTo: null }), agreement({ id: "pending", agreedPrice: 1, status: 0, effectiveFrom: "2026-06-01T00:00:00Z" })];
const [quotation] = supplierQuotationRowsSchema.parse([{ id: "q1", receivedQuotation: false, supplier: { id: "s1", name: "Acme", currency: { id: "c-usd", symbol: "$" } }, items: [
  { id: "i1", quantity: 25_000_000, material: { id: "m1", name: "Maize starch" }, uoM: { id: "u-mg", symbol: "mg" } },
  { id: "i2", quantity: 40, material: { id: "m2", name: "Blister film" }, uoM: { id: "u-pcs", symbol: "pcs" } },
  { quantity: 1, material: { id: "m3", name: "No line id" } }] }]);
if (!quotation) throw new Error("fixture");

it("uses the newest approved agreement in force, never a pending one", () => {
  expect(activeAgreement(agreements, "m1", "u-mg", now)?.id).toBe("a1");
  expect(activeAgreement(agreements, "m1", "u-mg", new Date("2025-06-01T00:00:00Z"))?.id).toBe("old");
  expect(activeAgreement(agreements, "m2", "u-pcs", now)).toBeNull();
});

it("starts price entry from the agreement, and from the only unit a counted material can be priced in", () => {
  const lines = startPriceLines(quotation, agreements, now);
  // The line without an id cannot be priced, so it is not offered.
  expect(lines.map((line) => [line.id, line.price, line.priceUnit, line.agreementId])).toEqual([["i1", 10, "kg", "a1"], ["i2", null, "pcs", null]]);
  expect(priceLineProblems(lines)).toEqual([{ id: "i2", field: "price", message: "Enter the price quoted for Blister film" }]);
  expect(priceLineProblems([{ ...lines[0]!, priceUnit: "" }])[0]?.field).toBe("priceUnit");
  expect(toQuotationResponse([{ ...lines[0]!, price: 12 }, { ...lines[1]!, price: 2.5 }])).toEqual([{ id: "i1", price: 12, priceUoM: "kg" }, { id: "i2", price: 2.5, priceUoM: "pcs" }]);
});

it("asks for a second look at a line worth almost nothing", () => {
  const [line] = startPriceLines(quotation, [], now);
  expect(negligibleLines([{ ...line!, quantity: 5, price: 12, priceUnit: "kg" }], "$")).toEqual([{ id: "i1", materialName: "Maize starch", text: "5 mg at $ 12 / kg comes to $ 0.00006" }]);
  expect(negligibleLines([{ ...line!, price: 12, priceUnit: "kg" }], "$")).toEqual([]);
});

it("proposes agreement changes only where the quoted price differs, within the agreement's dates", () => {
  const lines = startPriceLines(quotation, agreements, now).map((line) => line.id === "i2" ? { ...line, price: 2.5 } : line);
  // Unchanged against its agreement: nothing to propose. No agreement yet: a new one.
  expect(agreementChanges(lines, agreements).map((change) => [change.line.id, change.agreement?.id ?? null])).toEqual([["i2", null]]);
  const changed = agreementChanges(lines.map((line) => line.id === "i1" ? { ...line, price: 12 } : line), agreements);
  expect(changed.map((change) => change.line.id)).toEqual(["i1", "i2"]);
  const replace = agreementProposal(changed[0]!, new Date(2026, 9, 1), "q1", "c-usd");
  expect(replace).toMatchObject({ mode: "replace", id: "a1", body: { agreedPrice: 12, priceUoM: "kg", currencyId: "c-usd", effectiveFrom: "2026-10-01T00:00:00.000Z", effectiveTo: "2026-12-31T00:00:00Z" } });
  expect(agreementProposal(changed[1]!, new Date(2026, 9, 1), "q1", "c-usd")).toMatchObject({ mode: "create", body: { materialId: "m2", uoMId: "u-pcs", agreedPrice: 2.5, priceUoM: "pcs" } });
  expect(agreementProposal(changed[0]!, new Date(2025, 5, 1), "q1", "c-usd")).toEqual({ error: "Maize starch: the agreed date cannot be before the current agreement started" });
  expect(agreementProposal(changed[0]!, new Date(2027, 0, 5), "q1", "c-usd")).toEqual({ error: "Maize starch: the agreed date must fall within the current agreement" });
  expect(agreementProposal(changed[1]!, new Date(2026, 9, 1), "q1", null)).toEqual({ error: "The supplier has no currency, so a price agreement cannot be proposed" });
});

it("refuses to send a request the server would refuse", () => {
  expect(sendBlock({ email: "sales@acme.test", itemCount: 2 }, false)).toBeNull();
  expect(sendBlock({ email: null, itemCount: 2 }, false)).toContain("no email address");
  expect(sendBlock({ email: "sales@acme.test", itemCount: 2 }, true)).toContain("price comparison");
  expect(sendBlock({ email: "sales@acme.test", itemCount: 0 }, false)).toContain("no materials");
});

const usd = { id: "c-usd", symbol: "$" };
const quote = (supplier: string, price: number | null, priceUoM: string | null, request = "sr1", currency = usd) => ({ supplier: { id: supplier, name: supplier.toUpperCase(), currency }, sourceRequisition: { id: request, code: request.toUpperCase() }, price, priceUoM });
const groups = comparisonSchema.parse([
  { material: { id: "m1", name: "Maize starch" }, uoM: { id: "u-mg", symbol: "mg" }, quantity: 25_000_000, supplierQuotation: [quote("acme", 12, "kg"), quote("bolt", 0.011, "g", "sr2"), quote("cork", 9, null, "sr3")] },
  { material: { id: "m2", name: "Blister film" }, uoM: { id: "u-pcs", symbol: "pcs" }, quantity: 40, supplierQuotation: [quote("acme", 2.5, "pcs"), quote("dune", 2, "pcs", "sr4", { id: "c-eur", symbol: "€" })] },
]);

it("marks the lowest comparable price, but not across currencies or for a quote that cannot be awarded", () => {
  const [starch, film] = groups;
  expect(quoteCost(starch!, starch!.quotes[0]!)).toBe(300);
  expect(quoteCost(starch!, starch!.quotes[1]!)).toBe(275);
  expect(quoteBlock(starch!.quotes[2]!)).toContain("no unit");
  // 0.011 per g is cheaper than 12 per kg; the quote without a unit is not ranked at all.
  expect([...lowestQuotes(starch!).keys]).toEqual(["bolt:sr2"]);
  expect(lowestQuotes(film!)).toEqual({ keys: new Set(), mixedCurrencies: true });
});

it("creates one purchase order per supplier and request, and treats an unawardable choice as undecided", () => {
  const awards = { "m1:u-mg": "acme:sr1", "m2:u-pcs": "acme:sr1" };
  expect(undecided(groups, awards)).toEqual([]);
  expect(purchaseOrderDrafts(groups, awards)).toEqual([{ supplierId: "acme", supplierName: "ACME", sourceRequisitionId: "sr1", items: [
    { materialId: "m1", uomId: "u-mg", quantity: 25_000_000, price: 12, priceUoM: "kg", currencyId: "c-usd" }, { materialId: "m2", uomId: "u-pcs", quantity: 40, price: 2.5, priceUoM: "pcs", currencyId: "c-usd" }] }]);
  expect(purchaseOrderDrafts(groups, { "m1:u-mg": "bolt:sr2", "m2:u-pcs": "acme:sr1" }).map((draft) => draft.supplierId)).toEqual(["bolt", "acme"]);
  expect(chosenQuote(groups[0]!, { "m1:u-mg": "cork:sr3" })).toBeNull();
  expect(undecided(groups, { "m1:u-mg": "cork:sr3" }).map((group) => group.materialName)).toEqual(["Maize starch", "Blister film"]);
});

it("totals a purchase order from its lines, and gives no total when a line cannot be costed", () => {
  const [costed, uncosted] = purchaseOrderRowsSchema.parse([
    { id: "po1", code: "PO-1", supplier: { id: "s1", name: "Acme", currency: usd }, items: [
      { id: "l1", quantity: 25_000_000, price: 12, priceUoM: "kg", cost: 0, uom: { symbol: "mg" }, material: { name: "Maize starch" } },
      { id: "l2", quantity: 40, price: 2.5, priceUoM: null, cost: 100, uom: { symbol: "pcs" }, material: { name: "Blister film" } }] },
    { id: "po2", code: "PO-2", supplier: { id: "s1", name: "Acme" }, items: [{ id: "l3", quantity: 40, price: 2.5, priceUoM: null, cost: 0, uom: { symbol: "pcs" } }] },
    { code: "no id" },
  ]);
  expect(costed?.items.map((item) => item.cost)).toEqual([300, 100]);
  expect(costed?.total).toBe(400);
  expect(uncosted?.total).toBeNull();
});

it("lets a recorded price be corrected only while price comparison still shows that exact quote", () => {
  const recorded = supplierQuotationRowsSchema.parse([{ id: "q1", receivedQuotation: true, supplier: { id: "acme", name: "ACME" }, items: [
    { id: "i1", quantity: 25_000_000, quotedPrice: 12, priceUoM: "kg", material: { id: "m1", name: "Maize starch" }, uoM: { id: "u-mg", symbol: "mg" } },
    { id: "i2", quantity: 40, quotedPrice: 3, priceUoM: "pcs", material: { id: "m2", name: "Blister film" }, uoM: { id: "u-pcs", symbol: "pcs" } }] }])[0]!;
  // Starch waits in comparison at the recorded price; the film's comparison price differs, so it is another quotation's.
  expect([...correctableLineIds(recorded, groups, [recorded])]).toEqual(["i1"]);
  expect([...correctableLineIds(recorded, [], [recorded])]).toEqual([]);
  // A second quotation of the same supplier with the same material makes it impossible to tell which one is open.
  const twin = { ...recorded, id: "q0" };
  expect([...correctableLineIds(recorded, groups, [recorded, twin])]).toEqual([]);
  const open = new Set(["i1"]);
  expect(hasCorrections(recorded, [{ id: "i1", price: 12, priceUnit: "kg" }, { id: "i2", price: 99, priceUnit: "pcs" }], open)).toBe(false);
  expect(hasCorrections(recorded, [{ id: "i1", price: 11, priceUnit: "kg" }], open)).toBe(true);
});
