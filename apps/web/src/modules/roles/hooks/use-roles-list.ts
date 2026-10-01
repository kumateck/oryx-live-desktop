import { useMemo, useState } from "react";
import { z } from "zod";
import { useGetApiV1RoleQuery } from "../api/role-api";
import { audit } from "../lib/permissions";
import { roleRowSchema } from "../schemas/role-schema";
import { useRoleAccess } from "./use-role-access";

const emptyRoles: z.infer<typeof roleRowSchema>[] = [];

export function useRolesList() {
  const access = useRoleAccess();
  const [search, setSearch] = useState("");
  const query = useGetApiV1RoleQuery(audit, { skip: !access.view });
  const parsed = useMemo(() => query.data ? z.array(roleRowSchema).safeParse(query.data) : null, [query.data]);
  const roles = parsed?.success ? parsed.data : emptyRoles;
  const filtered = useMemo(() => roles.filter((role) =>
    `${role.name} ${role.displayName}`.toLowerCase().includes(search.toLowerCase().trim())), [roles, search]);
  return { access, query, parsed, roles: filtered, search, setSearch };
}
