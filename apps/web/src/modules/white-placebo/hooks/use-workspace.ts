import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetWhitePlaceboWorkspaceQuery } from "../api/white-placebo-api";
import { workspaceSchema } from "../schemas/white-placebo";
import { audit } from "../lib/white-placebo";

export function useWorkspace() {
  const query = useGetWhitePlaceboWorkspaceQuery(audit);
  const parsed = useMemo(() => query.currentData ? workspaceSchema.safeParse(query.currentData) : null, [query.currentData]);
  return { data: parsed?.success ? parsed.data : null, loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned White Placebo information the app could not read." : "",
    retry: () => { void query.refetch(); } };
}
