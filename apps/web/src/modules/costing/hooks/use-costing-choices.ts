import { useCallback, useEffect, useMemo, useState } from "react";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { useLazyGetApiV1CustomersQuery, useLazyGetApiV1ProductByProductIdPackingQuery, useLazyGetApiV1ProductQuery, usePostApiV1CollectionMutation } from "../api/costing-api";
import { costingAudit } from "../lib/costing";

const label = (item: { name?: string | null; symbol?: string | null }) => [item.name?.trim(), item.symbol?.trim() ? `(${item.symbol.trim()})` : ""].filter(Boolean).join(" ");

/** The currencies a price can be set in, from the configured currency collection. */
export function useCurrencyOptions(): { options: readonly SelectOption[]; loading: boolean } {
  const [load, state] = usePostApiV1CollectionMutation();
  useEffect(() => { void load({ ...costingAudit, body: ["Currency"] }); }, [load]);
  const options = useMemo(() => (state.data?.Currency ?? []).flatMap((item) => item.id && (item.name || item.symbol) ? [{ value: item.id, label: label(item) }] : []), [state.data]);
  return { options, loading: state.isLoading || state.isUninitialized };
}

/** Customers, products and each product's packing styles, searched on the server as the user types. */
export function useAgreementChoices() {
  const [loadCustomers] = useLazyGetApiV1CustomersQuery();
  const [loadProducts] = useLazyGetApiV1ProductQuery();
  const [loadPacking] = useLazyGetApiV1ProductByProductIdPackingQuery();
  const [packings, setPackings] = useState<Record<string, SelectOption[]>>({});
  const customers = useCallback<SelectLoader>(async (search, page) => {
    const data = (await loadCustomers({ ...costingAudit, searchQuery: search, page, pageSize: 20 })).data;
    return { options: (data?.data ?? []).flatMap((customer) => customer.id ? [{ value: customer.id, label: customer.name?.trim() || "Unnamed customer" }] : []),
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [loadCustomers]);
  const products = useCallback<SelectLoader>(async (search, page) => {
    const data = (await loadProducts({ ...costingAudit, searchQuery: search, page, pageSize: 20 })).data;
    return { options: (data?.data ?? []).flatMap((product) => product.id ? [{ value: product.id, label: [product.name, product.code].filter(Boolean).join(" · ") || "Unnamed product" }] : []),
      hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1 };
  }, [loadProducts]);
  const ensurePacking = useCallback(async (productId: string) => {
    if (!productId) return;
    const result = await loadPacking({ ...costingAudit, productId }, true);
    const options = (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: item.name?.trim() || "Unnamed packing style" }] : []);
    setPackings((current) => ({ ...current, [productId]: options }));
  }, [loadPacking]);
  return { customers, products, ensurePacking, packingsOf: (productId: string | undefined) => productId ? packings[productId] ?? [] : [] };
}
