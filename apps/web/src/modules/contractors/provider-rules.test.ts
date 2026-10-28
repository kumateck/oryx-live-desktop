import { expect, it } from "vitest";
import { providerDefaults, providerEditorSchema } from "./schemas/provider";
import { provider, secondService } from "./provider-fixture";
it("preserves every service association and international contact details in edits", () => {
  const original = {
    ...provider,
    services: [
      ...provider.services,
      { ...provider.services[0], id: secondService, name: "Service B", startDate: "2026-01-01", endDate: "2027-01-01", isActive: false, attachments: [] },
    ],
  };
  const values = providerDefaults(original);
  expect(values.services).toHaveLength(2);
  expect(values.phone).toBe("+44 1234 567890");
  expect(providerEditorSchema.safeParse(values).success).toBe(true);
});
it("refuses missing references, duplicate services and malformed email", () => {
  const values = providerDefaults(provider);
  expect(providerEditorSchema.safeParse({ ...values, country: null }).success).toBe(false);
  expect(providerEditorSchema.safeParse({ ...values, email: "bad" }).success).toBe(false);
  expect(providerEditorSchema.safeParse({ ...values, services: [...values.services, ...values.services] }).success).toBe(false);
});
