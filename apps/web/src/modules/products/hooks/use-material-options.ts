import { useCallback, useRef } from "react";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { useLazyGetApiV1MaterialDepartmentQuery } from "../api/product-api";
import type { MaterialFacts } from "../lib/bom";
import { departmentMaterialSchema } from "../schemas/bom-schema";

export const materialKind = { raw: 0, packaging: 1 } as const;

/**
 * Searches the department's materials of one kind for a picker, and remembers the details of every
 * material offered so the form can fill in its code, unit, and specification when one is chosen.
 */
export function useMaterialOptions(kind: 0 | 1, audit: { module: string; subModule: string }) {
  const [load] = useLazyGetApiV1MaterialDepartmentQuery();
  const seen = useRef(new Map<string, MaterialFacts>());

  const loader = useCallback((exclude: readonly string[]): SelectLoader => async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20, kind });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const materials = (result.data ?? []).flatMap((item) => {
      const parsed = departmentMaterialSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
    for (const { material, uoM } of materials) seen.current.set(material.id, { code: material.code, category: material.materialCategory,
      specification: material.specification, unit: { id: uoM?.id ?? "", symbol: uoM?.symbol?.trim() ?? "" } });
    const current = result.pageIndex ?? page;
    return {
      options: materials.filter(({ material }) => !exclude.includes(material.id))
        .map(({ material }) => ({ value: material.id, label: material.code ? `${material.code} - ${material.name}` : material.name })),
      hasNext: current < (result.pageCount ?? current),
      hasPrevious: current > 1,
    };
  }, [load, kind, audit]);

  return { loader, facts: (id: string | undefined) => id ? seen.current.get(id) ?? null : null };
}
