import { expect, it } from "vitest";
import { approvedMaterialRowsSchema, shelfBatchRowsSchema } from "../schemas/approved-material-schema";
import { freeToIssue } from "./stock";

it("shows the server's free, reserved, expired and not-released split, which adds up to the total", () => {
  const [row] = approvedMaterialRowsSchema.parse([{ material: { id: "m1", name: "Lumefantrine" }, unitOfMeasure: { symbol: "kg" }, totalAvailableQuantity: 500,
    reservedQuantity: 300, freeQuantity: 150, expiredQuantity: 40, unavailableQuantity: 10 }]);
  expect(row).toMatchObject({ available: 500, reserved: 300, free: 150, expired: 40, unavailable: 10 });
  expect(row && freeToIssue(row)).toBe(150);
  // An older server sends only the total and reserved.
  const [old] = approvedMaterialRowsSchema.parse([{ material: { id: "m2" }, totalAvailableQuantity: 100, reservedQuantity: 30 }]);
  expect(old && freeToIssue(old)).toBe(70);
});

it("reads each batch row's share of the totals", () => {
  const [usable, expired] = shelfBatchRowsSchema.parse([{ id: "s1", quantity: 100, uoM: { symbol: "kg" }, stockState: "Usable", reservedQuantity: 30, freeQuantity: 70, stockUnit: "kg" },
    { id: "s2", quantity: 5, uoM: { symbol: "kg" }, stockState: "Expired", reservedQuantity: 0, freeQuantity: 0 }]);
  expect(usable).toMatchObject({ stockState: "Usable", reserved: 30, free: 70, stockUnit: "kg" });
  expect(expired).toMatchObject({ stockState: "Expired", free: 0 });
});
