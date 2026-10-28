import { expect, it } from "vitest";
import { batchStatusLabel } from "@/shared/material-batches/batch-status";
import { grnSchema } from "../schemas/grn-schema";
import { approvedMaterials, distributionPlan, stockQuantity } from "./distribution-plan";
import { grnFixture, ids } from "./distribution-fixtures";

function readFixture(fixture = grnFixture()) {
  const grn = grnSchema.parse(fixture);
  if (!grn) throw new Error("Fixture needs a GRN id");
  return grn;
}

it("recognizes every backend batch status, preserving an explicit fallback for new and missing statuses", () => {
  expect(Array.from({ length: 13 }, (_, value) => batchStatusLabel(value))).toEqual([
    "Received", "Quarantine", "Testing", "Available", "Rejected", "Retest", "Frozen", "Consumed", "Approved", "Test taken", "Checked", "Sampled", "Test assigned",
  ]);
  expect(batchStatusLabel(99)).toBe("Unknown (99)");
  expect(batchStatusLabel(null)).toBe("Not recorded");
  for (const status of [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 99]) {
    const grn = grnSchema.parse(grnFixture(status));
    expect(grn && approvedMaterials(grn, 0)).toEqual([]);
  }
});

it("deduplicates repeated checklists and keeps allocations linked to their own requisition, without exceeding any stock or request", () => {
  const fixture = grnFixture();
  const first = fixture.checkLists[0];
  if (first) fixture.checkLists.push(first);
  const grn = readFixture(fixture);
  expect(approvedMaterials(grn, 0)).toHaveLength(1);
  const plan = distributionPlan(grn, ids.material, 0);
  expect(plan.problem).toBeNull();
  expect([plan.available, plan.requested]).toEqual([13_000_000, 10_000_000]);
  expect(plan.warehouses.map((warehouse) => [warehouse.name, warehouse.allocated])).toEqual([["Research store", 2_000_000], ["Production store", 8_000_000]]);
  expect(plan.warehouses[1]?.allocations.map((line) => [line.distributedRequisitionItemId, line.materialBatchId, line.quantity])).toEqual([
    [ids.request, ids.batch, 3_000_000], [ids.request2, ids.batch, 3_000_000], [ids.request2, ids.batch2, 2_000_000],
  ]);
  expect(stockQuantity(13_000_000, "mg")).toBe("13 kg");
  expect(stockQuantity(13_000_000, "kg")).toBe("13 kg");
  expect(distributionPlan(grn, ids.material, 1).warehouses).toEqual([]);
});

it("shows shortfalls, refuses missing evidence and incompatible units, and never assumes missing distribution quantities are zero", () => {
  const grn = readFixture();
  const limited = { ...grn, batches: grn.batches.map((batch) => ({ ...batch, distributed: batch.total - 500_000 })) };
  const plan = distributionPlan(limited, ids.material, 0);
  expect(plan.available).toBe(1_000_000);
  expect(plan.warehouses.map((row) => row.allocated)).toEqual([1_000_000, 0]);
  expect(distributionPlan({ ...grn, batches: grn.batches.map((batch) => ({ ...batch, distributed: null })) }, ids.material, 0).problem).toContain("incomplete");
  expect(distributionPlan({ ...grn, requests: grn.requests.map((request) => ({ ...request, unit: "L" })) }, ids.material, 0).problem).toContain("incompatible");
  expect(distributionPlan({ ...grn, requests: grn.requests.map((request) => ({ ...request, distributed: null })) }, ids.material, 0).warehouses).toEqual([]);
  expect(distributionPlan({ ...grn, requests: [] }, ids.material, 0).warehouses).toEqual([]);
});
