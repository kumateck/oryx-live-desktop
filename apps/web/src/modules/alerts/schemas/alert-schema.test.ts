import { expect, it } from "vitest";
import { alertDefaults, alertFormSchema, alertPayload, alertRecordSchema } from "./alert-schema";
export const sampleAlert = { id: "alert-one", title: "Warehouse alert", notificationType: 4, alertTypes: [0, 1], timeFrame: "2.03:04:05.1234567", roles: [{ id: "role-one", name: "QA" }], users: [{ id: "user-one", firstName: "Ada", lastName: "Mensah" }], isDisabled: false, isConfigurable: true };
it("preserves mixed role/user recipients, channels, event, and fractional delay on edit", () => {
  const record = alertRecordSchema.parse(sampleAlert);
  const values = alertDefaults(record);
  expect(alertPayload(values)).toEqual({ title: "Warehouse alert", notificationType: 4, alertTypes: [0, 1], timeFrame: "2.03:04:05.1234567", roleIds: ["role-one"], userIds: ["user-one"] });
  expect(alertFormSchema.safeParse({ ...values, channels: [] }).success).toBe(false);
  expect(alertFormSchema.safeParse({ ...values, roles: [], users: [] }).success).toBe(false);
});
it("rejects unsupported events and incomplete alert reads", () => {
  expect(alertRecordSchema.safeParse({ ...sampleAlert, notificationType: 99 }).success).toBe(false);
  expect(alertRecordSchema.safeParse({ ...sampleAlert, timeFrame: "not-a-duration" }).success).toBe(false);
});
