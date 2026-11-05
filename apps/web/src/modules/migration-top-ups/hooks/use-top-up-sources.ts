import { useCallback, useMemo, useRef } from "react";
import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { migrationAudit } from "@/modules/upload-center/api/stock-migration-api";
import { departmentMaterialRowSchema, departmentShelfSchema } from "../schemas/top-up-schema";

export interface PickedMaterial { id: string; code: string; name: string; unit: string }

/**
 * The signed-in user's department materials of one kind, searched page by page. The details of every
 * material offered are kept so the dialog knows the unit of the one chosen.
 */
export function useDepartmentMaterials(kind: MaterialKind) {
  const [load] = materialsApi.useLazyGetApiV1MaterialDepartmentQuery();
  const seen = useRef(new Map<string, PickedMaterial>());
  const loadOptions = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...migrationAudit, kind, searchQuery: search, page, pageSize: 20, sortLabel: "materialname", sortDirection: 1 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const rows = (result.data ?? []).flatMap((item) => { const parsed = departmentMaterialRowSchema.safeParse(item); return parsed.success ? [parsed.data] : []; });
    for (const { material, uoM } of rows) seen.current.set(material.id, { ...material, unit: uoM });
    const current = result.pageIndex ?? page;
    return {
      options: rows.map(({ material }) => ({ value: material.id, label: material.code ? `${material.code} · ${material.name}` : material.name })),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load, kind]);
  return { loadOptions, details: useCallback((id: string | undefined) => id ? seen.current.get(id) ?? null : null, []) };
}

/** The shelves of the user's own raw or packaging store, labelled with their rack and store. */
export function useDepartmentShelves(kind: MaterialKind) {
  const query = warehouseApi.useGetApiV1WarehouseShelfByDepartmentQuery({ ...migrationAudit, kind });
  const options = useMemo<SelectOption[]>(() => (Array.isArray(query.data) ? query.data : []).flatMap((item) => {
    const parsed = departmentShelfSchema.safeParse(item);
    if (!parsed.success) return [];
    const { id, name, code, warehouseLocationRack: rack } = parsed.data;
    const where = [rack?.name, rack?.warehouseLocation?.warehouse?.name].filter(Boolean).join(" · ");
    return [{ value: id, label: `${name || code || "Shelf"}${where ? ` — ${where}` : ""}` }];
  }).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })), [query.data]);
  return { options, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}
