import { expect, it } from "vitest";
import { emptySupplier, supplierDefaults, supplierFormSchema, supplierPayload } from "./supplier-form-schema";

const option = (value: string, label: string) => ({ value, label });

it("requires an association and rejects duplicate manufacturers and materials", () => {
  expect(supplierFormSchema.safeParse(emptySupplier()).success).toBe(false);
  const row = {
    kind: option("0", "Raw material"), material: option("mat-1", "Material one"),
    uom: option("kg", "kg"),
    defaultManufacturer: option("mfr-1", "Manufacturer one"), otherManufacturers: [option("mfr-1", "Manufacturer one")],
  };
  const values = { ...emptySupplier(), name: "Supply Co", contactPerson: "Ama", email: "ama@example.com",
    contactNumber: "0123456789", address: "Accra", country: option("gh", "Ghana"), currency: option("ghs", "GHS"),
    associations: [row] };
  expect(supplierFormSchema.safeParse(values).success).toBe(false);
  expect(supplierFormSchema.safeParse({ ...values, associations: [{ ...row, otherManufacturers: [] }, { ...row, otherManufacturers: [] }] }).success).toBe(false);
});

it("preserves the default and alternate manufacturer mapping in a request", () => {
  const values = supplierFormSchema.parse({
    name: "Supply Co", contactPerson: "Ama", email: "ama@example.com", contactNumber: "0123456789", address: "Accra",
    country: option("gh", "Ghana"), currency: option("ghs", "GHS"),
    associations: [{ kind: option("0", "Raw material"), material: option("mat-1", "Material one"),
      uom: option("kg", "kg"),
      defaultManufacturer: option("mfr-1", "Manufacturer one"), otherManufacturers: [option("mfr-2", "Manufacturer two")] }],
  });
  expect(supplierPayload(values)).toMatchObject({ type: 1, countryId: "gh", currencyId: "ghs",
    associatedManufacturers: [
      { materialId: "mat-1", purchaseUnit: "kg", manufacturerId: "mfr-1", default: true },
      { materialId: "mat-1", purchaseUnit: "kg", manufacturerId: "mfr-2", default: false },
    ] });
  const edit = supplierDefaults({}, [
    { material: { id: "mat-1", name: "Material one", kind: 0 }, uoM: { id: "uom-1", name: "Kilogram", symbol: "kg" },
      manufacturer: { id: "mfr-1", name: "Manufacturer one" }, default: true },
    { material: { id: "mat-1", name: "Material one", kind: 0 }, uoM: { id: "uom-1", name: "Kilogram", symbol: "kg" },
      manufacturer: { id: "mfr-2", name: "Manufacturer two" }, default: false },
  ]);
  expect(edit.associations).toHaveLength(1);
  expect(edit.associations[0]?.defaultManufacturer?.value).toBe("mfr-1");
  expect(edit.associations[0]?.uom?.value).toBe("kg");
  expect(edit.associations[0]?.otherManufacturers[0]?.value).toBe("mfr-2");
});

it("reloads the stored purchase symbol instead of the quantity-reference unit", () => {
  const values = supplierDefaults({}, [{ material: { id: "mat", name: "Material", kind: 0 },
    manufacturer: { id: "maker", name: "Factory" }, default: true,
    uoM: { id: "quantity-mg", name: "Milligram", symbol: "mg" }, purchaseUnit: "kg", pendingPurchaseUnit: "g" }]);
  expect(values.associations[0]?.uom).toEqual({ value: "kg", label: "kg" });
  expect(values.associations[0]?.pendingUnit).toBe("g");
  expect(supplierPayload(values).associatedManufacturers?.[0]).toEqual({
    materialId: "mat", manufacturerId: "maker", purchaseUnit: "kg", default: true,
  });
});
