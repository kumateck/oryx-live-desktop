import { useMemo } from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

interface QueryLike<TData> {
  data?: TData | undefined;
  error?: FetchBaseQueryError | SerializedError | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

/** Validates a query's rows and reports loading and failure in the shape the data tables take. */
export function useParsedQuery<TData, TSchema extends z.ZodType>(query: QueryLike<TData>, schema: TSchema) {
  const parsed = useMemo(() => query.data === undefined ? null : schema.safeParse(query.data), [query.data, schema]);
  // A product without this kind of document answers 404 or 204; that is an empty list, not a failure.
  const missing = Boolean(query.error && "status" in query.error && query.error.status === 404);
  return {
    rows: parsed?.success ? parsed.data as z.infer<TSchema> : null,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: missing ? null : query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned records the app could not read." : null,
    onRetry: () => { query.refetch(); },
  };
}
