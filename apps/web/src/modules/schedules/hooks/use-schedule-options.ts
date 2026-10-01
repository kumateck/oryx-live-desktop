import { useCallback, useMemo, useRef } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { useGetApiV1CustomersQuery, useLazyGetApiV1ProductQuery } from "../api/schedule-api";
import { audit } from "../lib/schedule-access";
import type { ProductFacts } from "../lib/schedule-products";

const none: readonly SelectOption[] = [];

/** The products and market types a schedule's lines choose from. */
export function useScheduleOptions() {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const [load] = useLazyGetApiV1ProductQuery();
  const customers = useGetApiV1CustomersQuery({ ...audit, pageSize: 1000 });
  // The batch size of every product offered, so a line can show its quantity without another request.
  const seen = useRef(new Map<string, ProductFacts>());

  const loadProducts = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20, ...(departmentId ? { departmentId } : {}) });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return {
      options: (result.data ?? []).flatMap((product) => {
        if (!product.id) return [];
        seen.current.set(product.id, { fullBatchSize: product.fullBatchSize ?? null, unit: product.baseUoM?.symbol?.trim() || null });
        return [{ value: product.id, label: product.code ? `${product.code} - ${product.name ?? ""}` : product.name ?? "Unnamed product" }];
      }),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1,
    };
  }, [load, departmentId]);

  const customerRows = customers.data?.data;
  return {
    loadProducts,
    facts: useCallback((productId: string | undefined) => productId ? seen.current.get(productId) ?? null : null, []),
    markets: useMemo(() => customerRows ? customerRows.flatMap((customer) => customer.id ? [{ value: customer.id, label: customer.name?.trim() || "Unnamed" }] : []) : none, [customerRows]),
    marketsUnavailable: Boolean(customers.error),
    retryMarkets: () => { void customers.refetch(); },
  };
}
export type ScheduleOptions = ReturnType<typeof useScheduleOptions>;
