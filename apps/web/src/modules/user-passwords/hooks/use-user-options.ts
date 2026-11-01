import { useCallback } from "react";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { useLazyGetApiV1UserQuery } from "../api/user-password-api";
import { audit } from "../lib/user-password";
import { pickableUserSchema } from "../schemas/user-password-schema";

/** Searches every user account, active or disabled, by name or email. */
export function useUserOptions(): SelectLoader {
  const [load] = useLazyGetApiV1UserQuery();
  return useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const users = (result.data ?? []).flatMap((item) => {
      const parsed = pickableUserSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
    const current = result.pageIndex ?? page;
    return {
      options: users.map((user) => ({ value: user.id, label: user.label })),
      hasNext: current < (result.pageCount ?? current),
      hasPrevious: current > 1,
    };
  }, [load]);
}
