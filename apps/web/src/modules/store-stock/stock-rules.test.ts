import { expect, it } from "vitest";
import { routeAccessPolicy, resolveQueryAccess } from "@/modules/registry-model";
import { manifest } from "./manifest";
import { receiptProblem, readReceipts } from "./lib/receipts";
import { receipt, creator, unitId } from "./fixture";
it("does not infer access to other stores or unknown sibling routes", () => {
  const actor = { state: "authenticated", permissions: new Set(["CanViewItStoreAvailableStocks"]) } as const;
  const policy = routeAccessPolicy([manifest], "/extrals/available-stocks");
  expect(policy?.query && resolveQueryAccess(policy.query, "?storeType=0", actor)).toEqual({ state: "allowed" });
  expect(policy?.query && resolveQueryAccess(policy.query, "?storeType=1", actor)).toEqual({ state: "redirect", search: "?storeType=0" });
  expect(routeAccessPolicy([manifest], "/extrals/job-orders")).toBeNull();
});
it("requires pending positive whole-number quantities, current evidence and a distinct known creator", () => {
  expect(receiptProblem(receipt, receipt, unitId)).toBeNull();
  expect(receiptProblem(receipt, receipt, creator)).toContain("Another authorized user");
  const ownerless = { ...receipt, createdBy: null };
  expect(receiptProblem(ownerless, ownerless, unitId)).toContain("creator");
  const fraction = { ...receipt, quantity: 0.5 };
  expect(receiptProblem(fraction, fraction, unitId)).toContain("whole-number");
  expect(receiptProblem(receipt, { ...receipt, quantity: 6 }, unitId)).toContain("changed");
  const done = { ...receipt, status: 1 };
  expect(receiptProblem(done, done, unitId)).toContain("pending");
});
it("rejects incomplete receipt pagination instead of deciding from partial evidence", async () => {
  await expect(readReceipts(async () => ({ data: [receipt], pageIndex: 1, pageCount: 1, totalRecordCount: 2 }))).rejects.toThrow();
});
