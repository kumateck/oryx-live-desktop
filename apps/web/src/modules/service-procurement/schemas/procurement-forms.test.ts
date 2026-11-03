import { expect, it } from "vitest";
import { editQuotationFormSchema, memoFormSchema, quotationFormSchema, respondProformaFormSchema } from "./procurement-forms";

const item = { value: "i1", label: "Filter" };
const quotation = { number: "Q-1", submitted: new Date(2026, 9, 20), currency: { value: "c1", label: "GHS" }, days: "2", completion: new Date(2026, 9, 25), notes: "", store: { value: "1", label: "General store" }, charges: [{ name: { value: "c1", label: "Labour" }, cost: "100.00001" }], materials: [{ item, quantity: "1.5000", price: "0" }] };
it("permits zero costs and fractional materials, preserving the entered precision", () => {
  expect(quotationFormSchema.parse(quotation).materials[0]).toEqual({ item, quantity: "1.5000", price: "0" });
  expect(quotationFormSchema.parse(quotation).charges[0]?.cost).toBe("100.00001");
});
it("refuses duplicated materials and incomplete service charges", () => {
  expect(quotationFormSchema.safeParse({ ...quotation, materials: [...quotation.materials, ...quotation.materials] }).success).toBe(false);
  expect(quotationFormSchema.safeParse({ ...quotation, charges: [{ name: null, cost: "5" }] }).success).toBe(false);
  expect(quotationFormSchema.safeParse({ ...quotation, charges: [] }).success).toBe(false);
});
it("requires finite charges, whole positive days, a currency and completion dates", () => {
  for (const charge of ["", "-1", "Infinity"]) expect(editQuotationFormSchema.safeParse({ charge, days: "2", completion: new Date(), notes: "" }).success).toBe(false);
  for (const days of ["", "0", "1.5"]) expect(quotationFormSchema.safeParse({ ...quotation, days }).success).toBe(false);
  expect(quotationFormSchema.safeParse({ ...quotation, currency: null }).success).toBe(false);
  expect(quotationFormSchema.safeParse({ ...quotation, completion: null }).success).toBe(false);
});
it("requires memo completion on or after its start", () => {
  const memo = { issued: new Date(2026, 9, 20), start: new Date(2026, 9, 22), completion: new Date(2026, 9, 21), charge: "1", materials: "0", terms: "", instructions: "" };
  expect(memoFormSchema.safeParse(memo).success).toBe(false);
  expect(memoFormSchema.safeParse({ ...memo, completion: memo.start }).success).toBe(true);
});
it("requires an invoice and every proforma price while allowing zero-priced lines", () => {
  const values = { invoice: "PI-1", date: new Date(), notes: "", prices: [{ price: "0" }, { price: "0.00001" }] };
  expect(respondProformaFormSchema.safeParse(values).success).toBe(true);
  expect(respondProformaFormSchema.safeParse({ ...values, invoice: " " }).success).toBe(false);
  expect(respondProformaFormSchema.safeParse({ ...values, prices: [{ price: "" }] }).success).toBe(false);
});
