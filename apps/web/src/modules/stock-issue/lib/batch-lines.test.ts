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

it("totals batches kept in another unit in the line's unit, through the material's density", () => {
  // Vanilla Liquid (requisition 01a1f4ae): 652.1739 ml asked; three lots set aside in mg, 750 g at 1.15 g/mL.
  const vanilla = (key: string, quantity: number) => ({ ...batch(key, quantity, "2028-02-28"), unit: "mg" });
  const lines = batchLines({ quantity: 750_000 / 1_150, unit: "ml", density: 1.15, batches: [vanilla("A", 750), vanilla("B", 744_684), vanilla("C", 4_566)] });
  expect(lines.short).toBe(0);
  expect(lines.total).toBeCloseTo(652.1739, 4);
  expect(lines.conversion).toMatchObject({ unit: "mg", total: 750_000, density: 1.15 });
  expect(lines.conversion?.required).toBeCloseTo(750_000, 3);
  expect(lines.totalLine).toBe(true);
  // One lot in another unit still shows the conversion; a shortfall is in the line's unit.
  const single = batchLines({ quantity: 652.1739, unit: "ml", density: 1.15, batches: [vanilla("A", 575_000)] });
  expect(single.totalLine).toBe(true);
  expect(single.short).toBeCloseTo(152.1739, 4);
  // Same family needs no density; same unit needs no conversion.
  expect(batchLines({ quantity: 2, unit: "kg", batches: [{ ...batch("A", 2_000_000, null), unit: "mg" }] }).conversion).toMatchObject({ unit: "mg", density: null });
  expect(batchLines({ quantity: 5, unit: "kg", batches: [{ ...batch("A", 5, null), unit: "kg" }] }).conversion).toBeNull();
});
