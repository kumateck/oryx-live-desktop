import { useProductWorkspace } from "./use-product-workspace";
import { useCallback, useRef } from "react";
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
  const { lookupProductId } = useProductWorkspace();
  const [load] = useLazyGetApiV1MaterialDepartmentQuery();
  const seen = useRef(new Map<string, MaterialFacts>());

  const remember = useCallback((item: DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto) => {
    const parsed = departmentMaterialSchema.safeParse(item);
    if (!parsed.success) return null;
    const { material, uoM, density } = parsed.data;
    const facts = { code: material.code, category: material.materialCategory, specification: material.specification,
      unit: { id: uoM?.id ?? "", symbol: uoM?.symbol?.trim() ?? "" }, density: density ?? 0 };
    seen.current.set(material.id, facts);
    return { material, facts };
  }, []);

  const loader = useCallback((exclude: readonly string[]): SelectLoader => async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20, kind, ...(lookupProductId ? { productId: lookupProductId } : {}) });
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
  }, [load, kind, audit, lookupProductId, remember]);

  const facts = useCallback((id: string | undefined) => id ? seen.current.get(id) ?? null : null, []);
  const lookupFacts = useCallback(async (id: string, search: string) => {
    const result = await load({ ...audit, searchQuery: search, page: 1, pageSize: 20, kind,
      ...(lookupProductId ? { productId: lookupProductId } : {}) }).unwrap();
    for (const item of result.data ?? []) remember(item);
    return facts(id);
  }, [load, audit, kind, lookupProductId, remember, facts]);

  return { loader, facts, lookupFacts };
}
