import { expect, it } from "vitest";
import { AtrStatus, atrActions, stageCode } from "./atr";

it("offers each step of a test request in its own status", () => {
  expect([...atrActions(AtrStatus.New, false, false)]).toEqual(["sample"]);
  expect([...atrActions(AtrStatus.Sampled, false, false)]).toEqual(["acknowledge"]);
  expect([...atrActions(AtrStatus.Assigned, false, true)].sort()).toEqual(["assignments", "reassign", "start"]);
  expect(atrActions(AtrStatus.Testing, true, true).has("completeRetest")).toBe(true);
  expect(atrActions(AtrStatus.Testing, true, true).has("continue")).toBe(false);
  expect(atrActions(AtrStatus.Assigned, false, false).has("reassign")).toBe(false);
  expect([stageCode(0), stageCode(1), stageCode(2)]).toEqual(["IP", "BP", "FP"]);
});
