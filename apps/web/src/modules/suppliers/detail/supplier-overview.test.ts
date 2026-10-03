import { expect, it } from "vitest";
import { daysUntil, dueState, dueText } from "@/shared/format/due-dates";
import { certificateSummary, supplierAlerts, supplierTabs } from "./supplier-overview";

const now = new Date(2026, 9, 1, 15);
const day = (offset: number) => new Date(2026, 9, 1 + offset, 9).toISOString();

it("counts whole days to a date and says how close it is", () => {
  expect([daysUntil(day(0), now), daysUntil(day(12), now), daysUntil(day(-3), now), daysUntil(null, now), daysUntil("nonsense", now)]).toEqual([0, 12, -3, null, null]);
  expect([dueState(null), dueState(-1), dueState(0), dueState(60), dueState(61)]).toEqual(["none", "overdue", "soon", "soon", "ok"]);
  expect([dueText(0), dueText(1), dueText(12), dueText(-1), dueText(-3)]).toEqual(["today", "in 1 day", "in 12 days", "1 day overdue", "3 days overdue"]);
});

it("sorts certificates into valid, expiring, and expired, and finds the next expiry", () => {
  const summary = certificateSummary([{ expiryDate: day(400) }, { expiryDate: day(20) }, { expiryDate: day(-5) }], now);
  expect(summary).toEqual({ valid: 1, expiring: 1, expired: 1, nextExpiry: day(20) });
  expect(certificateSummary([], now)).toEqual({ valid: 0, expiring: 0, expired: 0, nextExpiry: null });
});

it("lists what needs attention, problems first", () => {
  const alerts = supplierAlerts({ status: 1, requalificationDueDate: day(30), materials: 0,
    certificates: { valid: 1, expiring: 2, expired: 1, nextExpiry: null } }, now);
  expect(alerts.map((alert) => [alert.level, alert.text])).toEqual([
    ["problem", "1 certificate has expired."],
    ["warning", "Requalification is due in 30 days."],
    ["warning", "2 certificates expire within 60 days."],
    ["warning", "No materials are linked to this supplier, so nothing can be ordered from it."],
  ]);
  expect(supplierAlerts({ status: 1, requalificationDueDate: day(-4), materials: 3, certificates: null }, now).map((alert) => alert.text)).toEqual(["Requalification is 4 days overdue."]);
  expect(supplierAlerts({ status: 2, requalificationDueDate: day(-4), materials: null, certificates: null }, now).map((alert) => alert.id)).toEqual(["rejected"]);
  expect(supplierAlerts({ status: 0, requalificationDueDate: null, materials: 0, certificates: null }, now).map((alert) => alert.id)).toEqual(["new"]);
  // An approved supplier with everything in order has nothing to flag.
  expect(supplierAlerts({ status: 1, requalificationDueDate: day(200), materials: 2, certificates: { valid: 3, expiring: 0, expired: 0, nextExpiry: null } }, now)).toEqual([]);
});

it("offers only the tabs the user may open", () => {
  const tabs = (permissions: string[]) => supplierTabs((permission) => permissions.includes(permission), 4).map((tab) => tab.label);
  expect(tabs([])).toEqual(["Overview", "Materials (4)"]);
  expect(tabs(["CanViewSupplierSpend"])).toEqual(["Overview", "Materials (4)", "Performance and spend"]);
  expect(tabs(["CanViewSupplierCertifications", "CanManageSupplierContracts"])).toEqual(["Overview", "Materials (4)", "Certifications", "Contacts", "Banking", "Pricing"]);
  expect(supplierTabs(() => false, null)[1]?.label).toBe("Materials");
});
