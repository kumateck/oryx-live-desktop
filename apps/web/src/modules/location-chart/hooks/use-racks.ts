import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useGetApiV1WarehouseRackByDepartmentSummaryQuery } from "../api/location-api";
import { audit } from "../lib/location-access";
import { rackSummarySchema, type RackSummary } from "../schemas/rack-schema";

const none: RackSummary[] = [];

/** The racks of one kind in the user's department, with their shelves. One request serves the rack picker and every destination picker. */
export function useRacks(kind: MaterialKind | null) {
  const query = useGetApiV1WarehouseRackByDepartmentSummaryQuery({ ...audit, kind: kind ?? 0 }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? rackSummarySchema.safeParse(query.data) : null, [query.data]);
  return {
    racks: parsed?.success ? parsed.data : none,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned racks the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
