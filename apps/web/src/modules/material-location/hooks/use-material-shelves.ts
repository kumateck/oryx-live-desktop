import { useMemo } from "react";
import { shelfBatchRowsSchema, type ShelfBatchRow } from "@/modules/approved-materials/schemas/approved-material-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useGetApiV1MaterialByMaterialIdShelfQuery, useGetApiV1MaterialDepartmentQuery } from "../api/material-location-api";
import { audit } from "../lib/material-location-access";
import { materialStockRowsSchema } from "../schemas/material-location-schema";

const none: ShelfBatchRow[] = [];

/** Every shelf in the department that holds the material. */
export function useMaterialShelves(materialId: string, departmentId: string | null) {
  const query = useGetApiV1MaterialByMaterialIdShelfQuery({ ...audit, materialId, ...(departmentId ? { departmentId } : {}) }, { skip: !departmentId });
  const parsed = useMemo(() => query.data ? shelfBatchRowsSchema.safeParse(query.data) : null, [query.data]);
  // A record left at zero after a move is no longer a place the material is.
  const rows = useMemo(() => parsed?.success ? parsed.data.filter((row) => row.quantity > 0) : none, [parsed]);
  return { rows, loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned shelf records the app could not read." : null };
}

/** The material's stock levels. The backend only serves them in the department list, so the list is searched for this one material. */
export function useMaterialLevels(material: { id: string; code: string | null; name: string; kind: MaterialKind }) {
  const query = useGetApiV1MaterialDepartmentQuery({ ...audit, kind: material.kind, page: 1, pageSize: 20, searchQuery: material.code ?? material.name });
  return useMemo(() => { const parsed = materialStockRowsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data.find((row) => row.id === material.id) ?? null : null; }, [query.data, material.id]);
}
