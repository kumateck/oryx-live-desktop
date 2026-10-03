import { expect, it } from "vitest";
import { approvalState, manufacturerAlerts, materialCounts, packQuantity } from "./manufacturer-overview";

const now = new Date(2026, 9, 1, 15);
const day = (offset: number) => new Date(2026, 9, 1 + offset, 9).toISOString();

it("is approved from its approval date until its validity date passes", () => {
  expect(approvalState({ approvedAt: null, validityDate: day(90) }, now)).toBe("pending");
  expect(approvalState({ approvedAt: day(-100), validityDate: day(90) }, now)).toBe("approved");
  expect(approvalState({ approvedAt: day(-100), validityDate: day(0) }, now)).toBe("approved");
  expect(approvalState({ approvedAt: day(-100), validityDate: day(-1) }, now)).toBe("lapsed");
  expect(approvalState({ approvedAt: day(-100), validityDate: null }, now)).toBe("approved");
});

it("flags a lapsed, expiring, open-ended, or empty manufacturer", () => {
  const texts = (manufacturer: { approvedAt?: string | null; validityDate?: string | null }, materials: number) => manufacturerAlerts(manufacturer, materials, now).map((alert) => `${alert.level}: ${alert.text}`);
  expect(texts({ approvedAt: day(-400), validityDate: day(-3) }, 2)).toEqual(["problem: The approval ran out 3 days ago. Materials from this manufacturer should not be ordered until it is renewed."]);
  expect(texts({ approvedAt: day(-400), validityDate: day(20) }, 2)).toEqual(["warning: The approval runs out in 20 days."]);
  expect(texts({ approvedAt: day(-400), validityDate: null }, 0)).toEqual([
    "warning: No validity date is recorded, so the approval never comes up for renewal.", "warning: No materials are recorded for this manufacturer."]);
  expect(texts({ approvedAt: null }, 1)[0]).toContain("not approved yet");
  expect(texts({ approvedAt: day(-10), validityDate: day(300) }, 3)).toEqual([]);
});

it("describes pack sizes and counts materials by kind", () => {
  expect(packQuantity({ quantityType: 0, quantityPerPackOption: { values: [25, 50] } })).toBe("25, 50");
  expect(packQuantity({ quantityType: 1, quantityPerPackOption: { min: 10, max: 40 } })).toBe("10 to 40");
  expect(packQuantity({ quantityType: 1, quantityPerPackOption: { min: 10 } })).toBe("from 10");
  expect(packQuantity({ quantityType: 0, quantityPerPackOption: { values: [] } })).toBeNull();
  expect(materialCounts([{ material: { kind: 0 } }, { material: { kind: 1 } }, { material: { kind: 0 } }, {}])).toEqual({ total: 4, raw: 2, packaging: 1 });
});
