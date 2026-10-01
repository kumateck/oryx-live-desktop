import { useCallback, useEffect, useMemo, useState } from "react";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import {
  useGetApiV1DepartmentQuery, useGetApiV1ProductEquipmentAllQuery, usePostApiV1CollectionMutation, usePostApiV1CollectionUomPaginatedMutation,
} from "../api/product-api";
import { unitLabel } from "../lib/product-form";

const productCategory = "ProductCategory";
const rawUnit = 0;
const productionDepartment = 0;
const settings = (subModule: string) => ({ module: "Settings", subModule });

function options(items: readonly { id?: string | null; name?: string | null }[] | null | undefined): SelectOption[] {
  return (items ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name?.trim() || "Unnamed" }] : []);
}

/** Categories, raw-material units, equipment, and production departments for the product form. */
export function useProductOptions() {
  const [loadCollection, collection] = usePostApiV1CollectionMutation();
  const [loadUnits, units] = usePostApiV1CollectionUomPaginatedMutation();
  const equipment = useGetApiV1ProductEquipmentAllQuery(settings("Equipment"));
  const departments = useGetApiV1DepartmentQuery({ ...settings("Departments"), type: productionDepartment, pageSize: 100 });
  const [attempt, setAttempt] = useState(0);

  // These two lists are served by POST endpoints, so they are requested once here rather than cached as queries.
  useEffect(() => {
    void loadCollection({ module: "General", subModule: "Collection", body: [productCategory] });
    void loadUnits({ module: "General", subModule: "Collection", domainEntitiesBaseFilterUnitOfMeasure: { types: [rawUnit], pageSize: 100 } });
  }, [loadCollection, loadUnits, attempt]);

  const unitRows = units.data?.data;
  const unitOptions = useMemo(() => (unitRows ?? []).flatMap((unit) => unit.id && unit.type === rawUnit
    ? [{ value: unit.id, label: unitLabel(unit) }] : []), [unitRows]);
  const unitSymbols = useMemo(() => new Map((unitRows ?? []).flatMap((unit) => unit.id ? [[unit.id, unit.symbol?.trim() ?? ""] as const] : [])), [unitRows]);
  const equipmentRefetch = equipment.refetch;
  const departmentRefetch = departments.refetch;
  const retry = useCallback(() => { setAttempt((value) => value + 1); void equipmentRefetch(); void departmentRefetch(); }, [equipmentRefetch, departmentRefetch]);
  const failure = collection.error ?? units.error ?? departments.error ?? equipment.error;

  return {
    categories: useMemo(() => options(collection.data?.[productCategory]), [collection.data]),
    units: unitOptions,
    unitSymbol: (id: string | undefined) => id ? unitSymbols.get(id) ?? null : null,
    equipment: useMemo(() => options(equipment.data), [equipment.data]),
    departments: useMemo(() => options(departments.data?.data), [departments.data]),
    loading: collection.isLoading || collection.isUninitialized || units.isLoading || units.isUninitialized || equipment.isLoading || departments.isLoading,
    error: failure ? apiErrorMessage(failure) : null,
    retry,
  };
}

export type ProductOptions = ReturnType<typeof useProductOptions>;
