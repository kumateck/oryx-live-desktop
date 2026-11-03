import { useGetApiV1MaterialByMaterialIdUomQuery } from "../api/product-api";
import { materialUnitSchema, type MaterialUnit, type MaterialUnitAudit } from "../lib/material-unit";

type UnitState = { status: "ready"; unit: MaterialUnit } | { status: "loading" | "missing" | "error"; unit: null };

/** The endpoint reads the authenticated user's department linkage, never the material's purchase UOM. */
export function useMaterialUnit(materialId: string | undefined, known: MaterialUnit | null, audit: MaterialUnitAudit) {
  const verified = materialUnitSchema.safeParse(known);
  const query = useGetApiV1MaterialByMaterialIdUomQuery({ ...audit, materialId: materialId ?? "" }, { skip: !materialId || verified.success });
  // The controller advertises a list, but GetUnitOfMeasureForMaterialDepartment returns one DTO.
  // Validate the actual response outside generated transport code and fail closed on an unreadable unit.
  const parsed = materialUnitSchema.safeParse(query.currentData);
  const state: UnitState = verified.success ? { status: "ready", unit: verified.data }
    : !materialId ? { status: "missing", unit: null }
    : query.isFetching ? { status: "loading", unit: null }
    : query.isError ? { status: "error", unit: null }
    : parsed.success ? { status: "ready", unit: parsed.data }
    : { status: "missing", unit: null };
  return { ...state, retry: () => { void query.refetch(); } };
}
