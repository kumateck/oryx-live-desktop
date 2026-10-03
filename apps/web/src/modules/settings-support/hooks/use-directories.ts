import { useMemo } from "react";
import { z } from "zod";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { referenceSchema } from "../schemas/common";

const directorySchema = z.array(referenceSchema);
const audit = { module: "Settings", subModule: "User Directory" };
/** Small cached reference lists, loaded only while a settings editor needs recipients. */
export function useSettingsDirectories() {
  const roles = settingsApi.useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: "Role" });
  const users = settingsApi.useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: "User" });
  const parsedRoles = useMemo(() => roles.currentData ? directorySchema.safeParse(roles.currentData) : null, [roles.currentData]);
  const parsedUsers = useMemo(() => users.currentData ? directorySchema.safeParse(users.currentData) : null, [users.currentData]);
  const problem = roles.error ?? users.error;
  const invalid = parsedRoles?.success === false || parsedUsers?.success === false;
  return {
    roles: parsedRoles?.success ? parsedRoles.data.map((row) => ({ value: row.id, label: row.name || "Unnamed role" })) : [],
    users: parsedUsers?.success ? parsedUsers.data.map((row) => ({ value: row.id, label: row.name || "Unnamed user" })) : [],
    loading: roles.isLoading || users.isLoading,
    error: problem ? apiErrorMessage(problem) : invalid ? "The recipient directory could not be read safely." : null,
    retry: () => { void roles.refetch(); void users.refetch(); },
  };
}
