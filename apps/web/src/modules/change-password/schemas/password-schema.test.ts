import { expect, it } from "vitest";
import { passwordFailure, passwordSchema } from "./password-schema";
it("never treats HTTP 200 without success true as a password change", () => {
  expect(passwordFailure({ success: false, errors: ["Current password is incorrect"] })).toBe("Current password is incorrect");
  expect(passwordFailure({})).toContain("did not confirm");
  expect(passwordFailure({ success: true })).toBeNull();
});
it("validates confirmation without trimming password secrets", () => {
  const values = { currentPassword: " old password ", newPassword: " new password ", confirmNewPassword: " new password " };
  expect(passwordSchema.parse(values)).toEqual(values);
  expect(passwordSchema.safeParse({ ...values, confirmNewPassword: "different" }).success).toBe(false);
  expect(passwordSchema.safeParse({ ...values, newPassword: "short", confirmNewPassword: "short" }).success).toBe(false);
});
