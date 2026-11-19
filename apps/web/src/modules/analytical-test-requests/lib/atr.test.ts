import { expect, it } from "vitest";
import { AtrStatus, atrActions, stageCode } from "./atr";

it("offers each step of a test request in its own status", () => {
  expect([...atrActions(AtrStatus.New, false, false)]).toEqual(["sample"]);
  expect([...atrActions(AtrStatus.Sampled, false, false)]).toEqual(["acknowledge"]);
  expect([...atrActions(AtrStatus.Assigned, false, true)].sort()).toEqual(["assignments", "print", "progress", "reassign", "repair", "start"]);
  expect(atrActions(AtrStatus.Testing, false, true).has("repair")).toBe(true);
  expect(atrActions(AtrStatus.TestTaken, false, true).has("repair")).toBe(false);
  expect(atrActions(AtrStatus.Testing, true, true).has("completeRetest")).toBe(true);
  expect(atrActions(AtrStatus.Testing, true, true).has("continue")).toBe(false);
  expect(atrActions(AtrStatus.Assigned, false, false).has("reassign")).toBe(false);
  // A generated certificate can be printed from the Test taken and Released queues only.
  expect(atrActions(AtrStatus.TestTaken, false, true).has("printCoa")).toBe(true);
  expect(atrActions(AtrStatus.Released, false, true).has("printCoa")).toBe(true);
  expect(atrActions(AtrStatus.Testing, false, true).has("printCoa")).toBe(false);
  expect([stageCode(0), stageCode(1), stageCode(2)]).toEqual(["IP", "BP", "FP"]);
});
