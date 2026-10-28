import { expect, it } from "vitest";
import { vendorSchema, defaults, editorSchema, storeValue, Store } from "./schemas/vendor";
const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
const other = "79e15fc7-4f91-45e3-abbb-330d35956510";
const vendor = vendorSchema.parse({
  id,
  name: "Vendor",
  address: "Address",
  phone: "+44 1234 567890",
  email: "vendor@example.com",
  contactPerson: "Contact",
  countryId: id,
  currencyId: other,
  country: { id, name: "Country" },
  currency: { id: other, name: "Currency" },
  items: [{ item: { id, name: "IT item", store: 0 } }, { item: { id: other, name: "General item", store: 1 } }],
});
it("retains all contact fields and multi-store item associations in edit defaults", () => {
  const values = defaults(vendor);
  expect(values.items.map((r) => r.value)).toEqual([id, other]);
  expect(values.currency?.value).toBe(other);
  expect(values.contactPerson).toBe("Contact");
  expect(values.store).toBeNull();
  expect(editorSchema.safeParse(values).success).toBe(true);
  expect(storeValue("0")).toBe(Store.IT);
});
it("rejects duplicate item identities, malformed contacts and missing references", () => {
  const value = defaults(vendor);
  expect(editorSchema.safeParse({ ...value, items: [value.items[0], value.items[0]] }).success).toBe(false);
  expect(editorSchema.safeParse({ ...value, email: "bad" }).success).toBe(false);
  expect(editorSchema.safeParse({ ...value, currency: null }).success).toBe(false);
  expect(editorSchema.safeParse({ ...value, items: [] }).success).toBe(false);
});
