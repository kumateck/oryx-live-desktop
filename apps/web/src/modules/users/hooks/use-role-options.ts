import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1RoleQuery } from "../api/user-api";
import { audit } from "../lib/user-access";
import { roleOptionSchema, type RoleOption } from "../schemas/user-schema";

const none: RoleOption[] = [];

/** Roles a user can be given. The backend identifies a role by its name, so that is the value sent. */
export function useRoleOptions(enabled = true) {
  const query = useGetApiV1RoleQuery(audit, { skip: !enabled });
  const parsed = useMemo(() => query.data ? roleOptionSchema.safeParse(query.data) : null, [query.data]);
  return {
    roles: parsed?.success ? parsed.data : none,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned roles the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
