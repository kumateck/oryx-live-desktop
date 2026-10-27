import { expect, it } from "vitest";
import { BatchStatus, batchActions, printsFilled } from "./qc-grn";

it("offers each QC step only in the batch status it belongs to", () => {
  expect([...batchActions(BatchStatus.Quarantine)]).toEqual(["sample"]);
  expect([...batchActions(BatchStatus.TestAssigned)].sort()).toEqual(["assignments", "print", "reassign", "start"]);
  expect([...batchActions(BatchStatus.TestTaken)].sort()).toEqual(["assignments", "check", "print"]);
  expect(batchActions(BatchStatus.Rejected).has("requestRetest")).toBe(true);
  expect([...batchActions(BatchStatus.Retest)]).toEqual(["viewRetest"]);
  expect(batchActions(null).size).toBe(0);
  expect([printsFilled(BatchStatus.Testing), printsFilled(BatchStatus.Approved)]).toEqual([false, true]);
});
