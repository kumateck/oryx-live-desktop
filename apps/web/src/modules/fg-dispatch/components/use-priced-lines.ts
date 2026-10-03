import { useMemo } from "react";
import { useGetCustomerPricingQuery } from "@/modules/customers/api/customer-api";
import { pricingSchema } from "@/modules/customers/schemas/customer-schema";
import { priceLines, type PricedLine } from "../lib/dispatch";
import type { Allocation, ProformaInvoice } from "../schemas/dispatch-schema";

/**
 * The lines of an invoice priced for its customer. The saved invoice's own lines are used when it has them,
 * otherwise what the allocation carries; the packing style always comes from the allocation.
 */
export function usePricedLines(allocation: Allocation | null, invoice: Pick<ProformaInvoice, "products" | "createdAt"> | null, asOf: string | null): { lines: PricedLine[]; loading: boolean; unavailable: boolean } {
  const customerId = allocation?.customer.id ?? "";
  const pricing = useGetCustomerPricingQuery(customerId, { skip: !customerId });
  const agreements = useMemo(() => { const parsed = pricingSchema.safeParse(pricing.data ?? []); return parsed.success ? parsed.data : []; }, [pricing.data]);
  const lines = useMemo(() => {
    const products = allocation?.products ?? [];
    const source = invoice?.products.length ? invoice.products.map((item) => ({ ...item, packingId: products.find((product) => product.productId === item.productId)?.packingId ?? null }))
      : products.map((product) => ({ key: product.key, productId: product.productId, name: product.name, code: product.code, genericName: product.genericName, listPrice: product.listPrice, quantity: product.quantity, packingId: product.packingId }));
    return priceLines(source.map((item) => ({ key: item.key, productId: item.productId, productName: item.name, genericName: item.genericName, code: item.code, packingId: item.packingId, quantity: item.quantity, listPrice: item.listPrice })), agreements, asOf, allocation?.customer.currency ?? null);
  }, [allocation, invoice, agreements, asOf]);
  return { lines, loading: pricing.isLoading, unavailable: Boolean(pricing.error) };
}
