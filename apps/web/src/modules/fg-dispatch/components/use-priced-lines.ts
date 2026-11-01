import { useEffect, useMemo } from "react";
import { salesApi } from "@/shared/api/generated/sales";
import { settingsApi } from "@/shared/api/generated/settings";
import { invoiceAudit as audit, priceLines, type Agreement, type PricedLine } from "../lib/dispatch";
import type { Allocation, ProformaInvoice } from "../schemas/dispatch-schema";

const { useGetApiV1CustomersByIdPricingAgreementsQuery } = salesApi;
const { usePostApiV1CollectionMutation } = settingsApi;

/**
 * The lines of an invoice priced for its customer. The saved invoice's own lines are used when it has them,
 * otherwise what the allocation carries; the packing style always comes from the allocation.
 */
export function usePricedLines(allocation: Allocation | null, invoice: Pick<ProformaInvoice, "products" | "createdAt"> | null, asOf: string | null): { lines: PricedLine[]; loading: boolean; unavailable: boolean } {
  const customerId = allocation?.customer.id ?? "";
  const pricing = useGetApiV1CustomersByIdPricingAgreementsQuery({ ...audit, id: customerId }, { skip: !customerId });
  const [loadCurrencies, currencyState] = usePostApiV1CollectionMutation();
  useEffect(() => { void loadCurrencies({ ...audit, body: ["Currency"] }); }, [loadCurrencies]);
  const currencies = useMemo(() => new Map((currencyState.data?.Currency ?? []).flatMap((item) => item.id ? [[item.id, item.symbol?.trim() || item.name?.trim() || ""] as const] : []).filter(([, label]) => label)), [currencyState.data]);
  const agreements = useMemo((): Agreement[] => (pricing.data ?? []).flatMap((item) => item.id && item.productId && item.productPackingId && item.effectiveFrom
    ? [{ id: item.id, productId: item.productId, productPackingId: item.productPackingId, agreedPrice: item.agreedPrice ?? Number.NaN, effectiveFrom: item.effectiveFrom, effectiveTo: item.effectiveTo ?? null,
      currency: item.currency ? { id: item.currency.id ?? null, name: item.currency.name ?? null, symbol: item.currency.symbol ?? null } : null }] : []), [pricing.data]);
  const lines = useMemo(() => {
    const products = allocation?.products ?? [];
    const source = invoice?.products.length ? invoice.products.map((item) => ({ ...item, packingId: products.find((product) => product.productId === item.productId)?.packingId ?? null }))
      : products.map((product) => ({ key: product.key, productId: product.productId, name: product.name, code: product.code, genericName: product.genericName, listPrice: product.listPrice, listCurrencyId: product.listCurrencyId, quantity: product.quantity, packingId: product.packingId }));
    return priceLines(source.map((item) => ({ key: item.key, productId: item.productId, productName: item.name, genericName: item.genericName, code: item.code, packingId: item.packingId, quantity: item.quantity, listPrice: item.listPrice,
      listCurrencyId: item.listCurrencyId, perShipper: products.find((product) => product.productId === item.productId)?.sources[0]?.perShipper ?? 0 })), agreements, asOf, currencies);
  }, [allocation, invoice, agreements, asOf, currencies]);
  return { lines, loading: pricing.isLoading || currencyState.isLoading, unavailable: Boolean(pricing.error) };
}
