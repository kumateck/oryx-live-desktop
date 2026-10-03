import { useCallback, useState } from "react";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { useLazyGetApiV1ProductByProductIdPackingQuery, useLazyGetApiV1ProductQuery } from "../api/customer-api";
import { auditFor } from "../lib/customers";

export interface PackingOption extends SelectOption { perShipper: number }

/** Products to choose from, searched on the server, and each product's packing styles, read once when it is first chosen. */
export function useProductChoices() {
  const [loadProducts] = useLazyGetApiV1ProductQuery();
  const [loadPacking] = useLazyGetApiV1ProductByProductIdPackingQuery();
  const [packings, setPackings] = useState<Record<string, PackingOption[]>>({});
  const products = useCallback<SelectLoader>(async (search, page) => {
    const result = await loadProducts({ ...auditFor("Products"), searchQuery: search, page, pageSize: 20 });
    const data = result.data;
    return { options: (data?.data ?? []).flatMap((product) => product.id ? [{ value: product.id, label: [product.name, product.code].filter(Boolean).join(" · ") || "Unnamed product" }] : []),
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [loadProducts]);
  const ensurePacking = useCallback(async (productId: string): Promise<PackingOption[]> => {
    if (!productId) return [];
    const result = await loadPacking({ ...auditFor("Products"), productId }, true);
    const options = (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name?.trim() || "Unnamed packing style", perShipper: item.packPerShipper ?? 0 }] : []);
    setPackings((current) => ({ ...current, [productId]: options }));
    return options;
  }, [loadPacking]);
  return { products, ensurePacking, packingsOf: (productId: string | undefined) => productId ? packings[productId] ?? [] : [] };
}
