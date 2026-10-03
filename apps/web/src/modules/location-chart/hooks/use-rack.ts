import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1WarehouseRackByRackIdQuery } from "../api/location-api";
import { audit } from "../lib/location-access";
import { rackSchema } from "../schemas/rack-schema";

/** One rack with the stock on each of its shelves. */
export function useRack(rackId: string | null) {
  const query = useGetApiV1WarehouseRackByRackIdQuery({ ...audit, rackId: rackId ?? "" }, { skip: !rackId });
  const parsed = useMemo(() => query.data ? rackSchema.safeParse(query.data) : null, [query.data]);
  return {
    rack: parsed?.success ? parsed.data : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a rack the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
