import { expect, it } from "vitest";
import { storageLocationsSchema, storageRackRowsSchema, rackFormSchema } from "../schemas/rack-schema";
import { letters, rackEditBlock, rackRemoveBlock, repeated, suggestRackName, suggestShelfCode } from "./rack-rules";

const [location] = storageLocationsSchema.parse([{ id: "l1", name: "Bay 1", floorName: "ground", warehouse: { name: "Warehouse A", type: 0 }, racks: [{ name: "G/01" }, { name: "G/03" }] }, { name: "no id" }]);
if (!location) throw new Error("fixture");

it("letters shelves A to Z, then AA", () => {
  expect([0, 1, 25, 26, 27, 52].map(letters)).toEqual(["A", "B", "Z", "AA", "AB", "BA"]);
});

it("suggests the next rack name that the location does not already use, and shelf codes from it", () => {
  // Two racks exist, so 03 is tried first; it is taken, so 04 is offered.
  expect(suggestRackName(location)).toBe("G/04");
  expect(suggestRackName({ ...location, rackNames: [] })).toBe("G/01");
  expect(suggestShelfCode(location, "G/04", 0)).toBe("W/RM/G/04/A");
  expect(suggestShelfCode({ ...location, kind: 1 }, "G/04", 2)).toBe("W/PM/G/04/C");
  expect(suggestShelfCode(null, "", 0)).toBe("S/RM/RACK/A");
});

const [empty, used, holding] = storageRackRowsSchema.parse([
  { id: "r1", name: "G/01", shelves: [{ id: "s1", code: "A", name: "A", materialBatches: [] }] },
  { id: "r2", name: "G/02", shelves: [{ id: "s2", code: "A", name: "A", materialBatches: [{ quantity: 0 }] }, { id: "s3", code: "B", name: "B" }] },
  { id: "r3", name: "G/03", shelves: [{ id: "s4", code: "A", name: "A", materialBatches: [{ quantity: 12 }] }] },
]);

it("lets a rack be changed only when none of its shelves has a stock record, even an emptied one", () => {
  expect(rackEditBlock(empty!)).toBeNull();
  expect(rackEditBlock(used!)).toContain("1 of this rack's shelves has stock records");
  expect(rackEditBlock(holding!)).not.toBeNull();
});

it("lets a rack be removed once nothing is on it", () => {
  expect(rackRemoveBlock(empty!)).toBeNull();
  expect(rackRemoveBlock(used!)).toBeNull();
  expect(rackRemoveBlock(holding!)).toContain("still holds stock");
});

it("refuses two shelves with the same name or code on one rack", () => {
  expect([...repeated(["A", " a ", "B", ""])]).toEqual(["a"]);
  const result = rackFormSchema.safeParse({ location: { value: "l1", label: "Bay 1" }, name: "G/04", description: "", shelves: [{ code: "X/A", name: "A" }, { code: "X/A", name: "a" }] });
  expect(result.success).toBe(false);
  expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["shelves.0.name", "shelves.0.code", "shelves.1.name", "shelves.1.code"]);
});
