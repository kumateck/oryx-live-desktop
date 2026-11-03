import { z } from "zod";
import { useGetApiV1MaterialByMaterialIdUomQuery } from "../api/product-api";
import type { PackagingUnit } from "../lib/packaging";
import { packagingAudit } from "./use-packaging";

const unitSchema = z.object({ id: z.string().trim().min(1), symbol: z.string().trim().min(1) });
type UnitState = { status: "ready"; unit: PackagingUnit } | { status: "loading" | "missing" | "error"; unit: null };

/** The endpoint reads the authenticated user's department linkage, never the material's purchase UOM. */
export function usePackagingUnit(materialId: string | undefined, known: PackagingUnit | null = null) {
  const verified = unitSchema.safeParse(known);
  const query = useGetApiV1MaterialByMaterialIdUomQuery({ ...packagingAudit, materialId: materialId ?? "" }, { skip: !materialId || verified.success });
  // The controller advertises a list, but GetUnitOfMeasureForMaterialDepartment returns one DTO.
  // Validate the actual response outside generated transport code and fail closed on an unreadable unit.
  const parsed = unitSchema.safeParse(query.currentData);
  const state: UnitState = verified.success ? { status: "ready", unit: verified.data }
    : !materialId ? { status: "missing", unit: null }
    : query.isFetching ? { status: "loading", unit: null }
    : query.isError ? { status: "error", unit: null }
    : parsed.success ? { status: "ready", unit: parsed.data }
    : { status: "missing", unit: null };
  return { ...state, retry: () => { void query.refetch(); } };
}
