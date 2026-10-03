import { expect, it } from "vitest";
import { approvalDefaults, approvalFormSchema, approvalPayload, approvalRecordSchema, newApprovalStage } from "./approval-settings-schema";
const role = { id: "role-one", name: "QA" };
export const sampleApproval = { id: "approval-one", itemType: "PurchaseOrder", escalationDuration: "1.02:03:04.1234567", approvalStages: [
  { role, user: null, required: true, order: 2 }, { role: null, user: { id: "user-one", name: "Ada" }, required: false, order: 1 },
] };
it("preserves required flags and exact delay, ordering stages and sending only one assignee", () => {
  const values = approvalDefaults(approvalRecordSchema.parse(sampleApproval));
  expect(approvalPayload(values)).toEqual({ itemType: "PurchaseOrder", escalationDuration: "1.02:03:04.1234567", approvalStages: [
    { userId: "user-one", required: false, order: 1 }, { roleId: "role-one", required: true, order: 2 },
  ] });
  expect(approvalPayload({ ...values, stages: [...values.stages].reverse() }).approvalStages?.[0]).toEqual({ roleId: "role-one", required: true, order: 1 });
});
it("requires one role for regulated routing and rejects missing or ambiguous stages", () => {
  const base = approvalDefaults();
  const document = { value: "ResponseMaterial", label: "Material ATR" };
  const stage = { ...newApprovalStage(), role: { value: role.id, label: role.name } };
  expect(approvalFormSchema.safeParse({ ...base, document, stages: [stage] }).success).toBe(true);
  expect(approvalFormSchema.safeParse({ ...base, document, stages: [stage, stage] }).success).toBe(false);
  expect(approvalFormSchema.safeParse({ ...base, document, stages: [] }).success).toBe(false);
  expect(approvalRecordSchema.safeParse({ ...sampleApproval, approvalStages: [{ ...sampleApproval.approvalStages[0], user: role }] }).success).toBe(false);
});
it("keeps legacy document keys without silently replacing the document type", () => {
  const record = approvalRecordSchema.parse({ ...sampleApproval, itemType: "LegacyDocument" });
  expect(approvalPayload(approvalDefaults(record)).itemType).toBe("LegacyDocument");
});
