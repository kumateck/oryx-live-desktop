import { useProductWorkspace } from "./use-product-workspace";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import type { DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto } from "@/shared/api/generated/materials";
import { useLazyGetApiV1MaterialDepartmentQuery } from "../api/product-api";
import type { MaterialFacts } from "../lib/bom";
import { departmentMaterialSchema } from "../schemas/bom-schema";

export const materialKind = { raw: 0, packaging: 1 } as const;

/**
 * Searches the department's materials of one kind for a picker, and remembers the details of every
 * material offered so the form can fill in its code, unit, and specification when one is chosen.
 */
export function useMaterialOptions(kind: 0 | 1, audit: { module: string; subModule: string }) {
  const { context, lookupProductId } = useProductWorkspace();
  const [load] = useLazyGetApiV1MaterialDepartmentQuery();
  const seen = useRef(new Map<string, MaterialFacts>());

  const remember = useCallback((item: DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto) => {
    const parsed = departmentMaterialSchema.safeParse(item);
    if (!parsed.success) return null;
    const { material, uoM } = parsed.data;
    const facts = { code: material.code, category: material.materialCategory, specification: material.specification,
      unit: { id: uoM?.id ?? "", symbol: uoM?.symbol?.trim() ?? "" } };
    seen.current.set(material.id, facts);
    return { material, facts };
  }, []);

  const loader = useCallback((exclude: readonly string[]): SelectLoader => async (search, page, signal) => {
    const request = load({ ...audit, ...context, searchQuery: search, page, pageSize: 20, kind, ...(lookupProductId ? { productId: lookupProductId } : {}) });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const materials = (result.data ?? []).flatMap((item) => {
      const remembered = remember(item);
      return remembered ? [remembered] : [];
    });
    const current = result.pageIndex ?? page;
    return {
      options: materials.filter(({ material }) => !exclude.includes(material.id))
        .map(({ material }) => ({ value: material.id, label: material.code ? `${material.code} - ${material.name}` : material.name })),
      hasNext: current < (result.pageCount ?? current),
      hasPrevious: current > 1,
    };
  }, [load, kind, audit, context, lookupProductId, remember]);

  const facts = useCallback((id: string | undefined) => id ? seen.current.get(id) ?? null : null, []);
  return { loader, facts };
}

/** Read every matching page afresh: a picker cache or its first page is not density authority. */
export function useBomDensity(materialId: string | undefined, search: string, audit: { module: string; subModule: string }) {
  const { context, lookupProductId } = useProductWorkspace();
  const [load] = useLazyGetApiV1MaterialDepartmentQuery();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; density: number | null; problem: string | null; failed: boolean } | null>(null);
  const key = JSON.stringify([materialId, search, context.context, lookupProductId, attempt]);
  const { module, subModule } = audit;
  useEffect(() => {
    if (!materialId) return;
    let active = true;
    let cancel = () => {};
    const read = async () => {
      try {
        for (let page = 1; active; page += 1) {
          const request = load({ module, subModule, ...context, searchQuery: search, page, pageSize: 20,
            kind: materialKind.raw, ...(lookupProductId ? { productId: lookupProductId } : {}) }, false);
          cancel = request.abort;
          const response = await request.unwrap();
          if (!active) return;
          const entry = response.data?.find((item) => item.material?.id === materialId);
          if (entry) {
            const parsed = departmentMaterialSchema.safeParse(entry);
            const value = parsed.success ? parsed.data.density : null;
            const unit = parsed.success ? parsed.data.densityUoM : null;
            const problem = !parsed.success ? "The saved department density could not be read."
              : !(value !== null && value > 0) ? "Set a positive measured density on this department's material link."
              : !unit?.id || unit.symbol?.trim().toLowerCase() !== "g/ml"
                ? `Saved density: ${value} ${unit?.symbol || "(unit not recorded)"}. Record its measured unit as g/mL on this department's material link.` : null;
            setResult({ key, density: problem ? null : value, problem, failed: false });
            return;
          }
          if (page >= (response.pageCount ?? page)) break;
        }
        if (active) setResult({ key, density: null, problem: "This material was not found in the product department's linked materials.", failed: false });
      } catch {
        if (active) setResult({ key, density: null, problem: null, failed: true });
      }
    };
    void read();
    return () => { active = false; cancel(); };
  }, [key, materialId, search, context, lookupProductId, module, subModule, load]);
  const current = result?.key === key ? result : null;
  return { density: current?.density ?? null, problem: current?.problem ?? null,
    loading: Boolean(materialId) && !current, failed: current?.failed ?? false,
    retry: () => setAttempt((value) => value + 1) };
}
