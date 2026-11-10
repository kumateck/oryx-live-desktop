import { expect, it } from "vitest";
import { massVolumeConversion } from "./density-conversion";

it("converts mass to volume and volume to mass using g/mL density", () => {
  expect(massVolumeConversion(1_000, "mg", "ml", 1.35)).toBeCloseTo(0.7407407407);
  expect(massVolumeConversion(1_000, "mg", "ml", 1.56)).toBeCloseTo(0.6410256410);
  expect(massVolumeConversion(1, "l", "kg", 1.35)).toBeCloseTo(1.35);
  expect(massVolumeConversion(1.35, "g", "ml", 1.35)).toBe(1);
});

it("fails closed for invalid density and unrelated units", () => {
  expect(massVolumeConversion(1, "mg", "ml", 0)).toBeNull();
  expect(massVolumeConversion(1, "mg", "g", 1.4)).toBeNull();
  expect(massVolumeConversion(1, "tablet", "ml", 1.4)).toBeNull();
});
