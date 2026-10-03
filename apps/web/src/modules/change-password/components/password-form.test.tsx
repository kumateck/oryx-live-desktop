// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { forgetSession } from "@/test/backend";
import { mountSettings, settingsBackend } from "@/modules/settings-support/testing";
import { PasswordForm } from "./password-form";
afterEach(() => { cleanup(); forgetSession(); });
async function fillPasswords() {
  fireEvent.change(await screen.findByLabelText(/^Current password/), { target: { value: " old password " } });
  fireEvent.change(await screen.findByLabelText(/^New password/), { target: { value: " new password " } });
  fireEvent.change(await screen.findByLabelText(/^Confirm new password/), { target: { value: " new password " } });
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));
}
it("uses the self-service endpoint with all secrets and preserves the form after a 200 rejection", async () => {
  const calls = settingsBackend(["CanChangePassword"], () => Response.json({ success: false, errors: ["Current password is incorrect"] }));
  mountSettings(<PasswordForm />); await fillPasswords();
  await screen.findByText("Current password is incorrect");
  expect(calls).toHaveLength(1);
  expect(calls[0]?.path).toBe("/api/v1/auth/user-reset-password");
  expect(calls[0]?.subModule).toBe("Change Password");
  expect(JSON.parse(calls[0]?.body ?? "null")).toEqual({ currentPassword: " old password ", newPassword: " new password ", confirmNewPassword: " new password " });
  expect(screen.queryByText("Signed out")).toBeNull();
});
it("signs out only after a confirmed successful change", async () => {
  const calls = settingsBackend(["CanChangePassword"], () => Response.json({ success: true, errors: [] }));
  mountSettings(<PasswordForm />); await fillPasswords(); await screen.findByText("Signed out");
  await waitFor(() => expect(calls).toHaveLength(1));
});
