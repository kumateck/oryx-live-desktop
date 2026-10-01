import { useEffect, useMemo, useState } from "react";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1CollectionUomPaginatedMutation } from "../api/product-api";
import { unitLabel } from "../lib/product-form";

export const unitType = { raw: 0, packing: 1, shipping: 2 } as const;

/** Units of measure, all and by type, for pickers in the product edit sections. */
export function useUnitOptions() {
  const [load, result] = usePostApiV1CollectionUomPaginatedMutation();
  const [attempt, setAttempt] = useState(0);
  // The unit list is served by a POST endpoint, so it is requested once here rather than cached as a query.
  useEffect(() => { void load({ module: "General", subModule: "Collection", domainEntitiesBaseFilterUnitOfMeasure: { pageSize: 200 } }); }, [load, attempt]);
  const rows = result.data?.data;
  const all = useMemo(() => (rows ?? []).flatMap((unit) => unit.id ? [{ value: unit.id, label: unitLabel(unit), type: unit.type }] : []), [rows]);
  return {
    all: all as readonly SelectOption[],
    ofType: (type: number): SelectOption[] => all.filter((unit) => unit.type === type).map(({ value, label }) => ({ value, label })),
    loading: result.isLoading || result.isUninitialized,
    error: result.error ? apiErrorMessage(result.error) : null,
    retry: () => setAttempt((value) => value + 1),
  };
}
