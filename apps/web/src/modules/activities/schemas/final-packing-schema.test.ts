import { expect, it } from "vitest";
import { extraIssuedSchema } from "./final-packing-schema";

// Extra raw material is requested on the same form and returned by the same endpoint, but it is never on the
// packaging requisition. Counting it made final packing report "extra packaging materials do not match".
it("keeps only packaging extras for final packing", () => {
  const extras = extraIssuedSchema.parse([
    { material: { id: "raw-1", kind: 0 }, quantity: 5, uoM: { id: "kg" } },
    { material: { id: "pack-1", kind: 1 }, quantity: 20, uoM: { id: "pc" } },
  ]);

  expect(extras).toEqual([{ materialId: "pack-1", quantity: 20, unitId: "pc" }]);
});

it("treats an extra without a material kind as packaging", () => {
  expect(extraIssuedSchema.parse([{ material: { id: "pack-1" }, quantity: 3 }]))
    .toEqual([{ materialId: "pack-1", quantity: 3, unitId: null }]);
});
