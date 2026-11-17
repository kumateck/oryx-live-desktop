import { expect, it } from "vitest";
import { batchLines, batchPlace } from "./batch-lines";

const batch = (key: string, quantity: number, expires: string | null) => ({ key, number: key, quantity, expires, returned: false });

it("orders batches soonest expiry first, undated last, and totals several of them", () => {
  // Sucrose BP: 47.325 kg from three batches.
  const lines = batchLines({ quantity: 47.325, batches: [batch("C", 2.325, "2027-06-30"), batch("none", 0, null), batch("A", 25, "2027-01-31"), batch("B", 20, "2027-03-31")] });
  expect(lines.batches.map((entry) => entry.key)).toEqual(["A", "B", "C", "none"]);
  expect(lines).toMatchObject({ total: 47.325, short: 0, totalLine: true });
});

it("prints no total for a single batch, unless it falls short", () => {
  expect(batchLines({ quantity: 250, batches: [batch("A", 250, "2030-03-31")] })).toMatchObject({ short: 0, totalLine: false });
  expect(batchLines({ quantity: 250, batches: [batch("A", 200, "2030-03-31")] })).toMatchObject({ short: 50, totalLine: true });
  expect(batchLines({ quantity: 250, batches: [] })).toMatchObject({ short: 250, totalLine: false });
});

it("reads the location as a place, without repeating a shelf's own word", () => {
  expect(batchPlace({ rack: "G/01", shelf: "G/01/A" })).toBe("G/01 · Shelf G/01/A");
  expect(batchPlace({ rack: "Rack A", shelf: "Shelf 2" })).toBe("Rack A · Shelf 2");
  expect(batchPlace({ rack: "G/01", shelf: null })).toBe("G/01 · Shelf not recorded");
  expect(batchPlace({ location: "R1 (S2)" })).toBe("R1 (S2)");
  expect(batchPlace({})).toBe("Location not recorded");
});
