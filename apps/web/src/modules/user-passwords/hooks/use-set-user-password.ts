import { useState } from "react";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { passwordAdminAccess } from "@/shared/auth/password-admin";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1AuthAdminUserPasswordMutation } from "../api/user-password-api";
import { audit } from "../lib/user-password";

export interface PasswordChange { readonly userId: string; readonly userLabel: string; readonly newPassword: string }

export type SaveState =
  | { readonly status: "idle" }
  | { readonly status: "saved"; readonly userLabel: string }
  | { readonly status: "failed"; readonly message: string };

/** Sends a confirmed password change and keeps the outcome for the page to show. */
export function useSetUserPassword() {
  const [send, sending] = usePostApiV1AuthAdminUserPasswordMutation();
  const permission = usePermissionAction(passwordAdminAccess);
  const [state, setState] = useState<SaveState>({ status: "idle" });

  /** Resolves true once the server confirms the change. */
  const save = async (change: PasswordChange): Promise<boolean> => {
    const denied = permission.check();
    if (denied) { setState({ status: "failed", message: denied }); return false; }
    const result = await send({ ...audit, domainEntitiesAuthAdminResetUserPasswordRequest: { userId: change.userId, newPassword: change.newPassword } });
    if ("error" in result) {
      setState({ status: "failed", message: `The password was not changed. ${apiErrorMessage(result.error)}` });
      return false;
    }
    setState({ status: "saved", userLabel: change.userLabel });
    return true;
  };

  return { save, saving: sending.isLoading, state, clear: () => setState({ status: "idle" }) };
}
