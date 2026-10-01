import { expect, it } from "vitest";
import { procedureStepFormSchema, savedRoutesSchema } from "../schemas/procedure-schema";
import { fromSavedRoutes, hasOperation, stepFromForm, toRoutesRequest } from "./procedure";

const saved = savedRoutesSchema.parse([
  { id: "r2", order: 2, operation: { id: "op-pack", name: "Packing" }, isCritical: false, workCenters: [{ workCenter: { id: "w2", name: "Line 2" } }],
    responsibleRoles: [{ role: { id: "role-1", name: "Operator" }, action: 2 }] },
  { id: "r1", order: 1, operation: { id: "op-test", name: "Testing" }, estimatedTime: "2 hours", isCritical: true, workCenters: [{ workCenter: { id: "w1", name: "Lab" } }],
    responsibleUsers: [{ user: { id: "u1", name: "Ama" }, action: 7, productAnalyticalRawData: { id: "ard-1", stage: 2, productStandardTestProcedure: { stpNumber: "STP-1" } } }] },
  { id: "r3", order: 3, operation: null },
]);

it("reads saved steps in their saved order and drops steps with no operation", () => {
  const steps = fromSavedRoutes(saved);
  expect(steps.map((step) => step.operation.label)).toEqual(["Testing", "Packing"]);
  expect(steps[0]?.parties[0]).toEqual({ kind: "user", who: { value: "u1", label: "Ama" }, action: { value: "7", label: "ATR" }, ard: { value: "ard-1", label: "STP-1 (Finished)" } });
  expect(hasOperation(steps, "op-pack", null)).toBe(true);
  expect(hasOperation(steps, "op-pack", "r2")).toBe(false);
});

it("numbers steps by position and leaves analytical raw data out of a copy", () => {
  const steps = fromSavedRoutes(saved);
  expect(toRoutesRequest(steps)).toEqual([
    { operationId: "op-test", order: 1, isCritical: true, estimatedTime: "2 hours", workCenters: [{ workCenterId: "w1" }],
      responsibleUsers: [{ userId: "u1", action: 7, productAnalyticalRawDataId: "ard-1" }], responsibleRoles: [] },
    { operationId: "op-pack", order: 2, isCritical: false, estimatedTime: null, workCenters: [{ workCenterId: "w2" }],
      responsibleUsers: [], responsibleRoles: [{ roleId: "role-1", action: 2, productAnalyticalRawDataId: null }] },
  ]);
  expect(toRoutesRequest(steps, false)[0]?.responsibleUsers?.[0]?.productAnalyticalRawDataId).toBeNull();
});

const base = { operation: { value: "op", label: "Op" }, workCenters: [{ value: "w1", label: "Lab" }], estimatedTime: null };
const who = { value: "u1", label: "Ama" };
const messages = (input: object) => { const result = procedureStepFormSchema.safeParse(input); return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`); };

it("requires a responsible party with a person and an instruction, without repeats", () => {
  expect(messages({ ...base, isCritical: true, parties: [] })).toEqual(["parties: Add at least one responsible user or role"]);
  expect(messages({ ...base, isCritical: true, parties: [{ kind: "role", who: null, action: null }] })).toEqual(["parties.0.who: Choose who is responsible", "parties.0.action: Choose an instruction"]);
  const full = { kind: "user", who, action: { value: "2", label: "Full return" } };
  expect(messages({ ...base, isCritical: true, parties: [full, full] })).toEqual(["parties.1.who: Already assigned this instruction"]);
});

it("refuses a main instruction on an automated step", () => {
  const atr = { kind: "user", who, action: { value: "7", label: "ATR" }, ard: { value: "a", label: "A" } };
  expect(messages({ ...base, isCritical: false, parties: [atr] })[0]).toContain("isCritical: An automated step");
  expect(messages({ ...base, isCritical: true, parties: [atr] })).toEqual([]);
});

it("drops analytical raw data from an instruction that is not ATR", () => {
  const values = procedureStepFormSchema.parse({ ...base, isCritical: true, parties: [{ kind: "user", who, action: { value: "2", label: "Full return" }, ard: { value: "a", label: "A" } }] });
  expect(stepFromForm(values, "k").parties[0]?.ard).toBeNull();
});
