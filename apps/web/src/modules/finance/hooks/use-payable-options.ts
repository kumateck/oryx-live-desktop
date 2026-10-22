import { useCallback } from "react";
import { procurementApi } from "@/shared/api/generated/procurement";
import { productionApi } from "@/shared/api/generated/production";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { financeAudit } from "../lib/access";
import { PayableType } from "../lib/payments";
interface PayablePage { pageIndex?: number; pageCount?: number; data?: { id?: string; code?: string | null; proformaInvoice?: { code?: string | null; allocateProductionOrder?: { invoiceCode?: string | null } } }[] | null }
export function payableOptions(page: PayablePage, requestedPage: number) {
  return { options: (page.data ?? []).flatMap((entry) => {
    const label = entry.code?.trim() || entry.proformaInvoice?.allocateProductionOrder?.invoiceCode?.trim() || entry.proformaInvoice?.code?.trim();
    return entry.id && label ? [{ value: entry.id, label }] : [];
  }), hasNext: (page.pageIndex ?? requestedPage) < (page.pageCount ?? requestedPage), hasPrevious: requestedPage > 1 };
}
export function usePayableOptions(type: string) {
  const [billing] = procurementApi.useLazyGetApiV1ProcurementBillingSheetQuery();
  const [shipment] = procurementApi.useLazyGetApiV1ProcurementShipmentInvoiceQuery();
  const [purchase] = procurementApi.useLazyGetApiV1ProcurementPurchaseOrderInvoiceQuery();
  const [customer] = productionApi.useLazyGetApiV1ProductionOrdersInvoiceQuery();
  return useCallback<SelectLoader>(async (searchQuery, page, signal) => {
    const args = { ...financeAudit, searchQuery, page, pageSize: 30 };
    const request = type === String(PayableType.CustomerInvoice) ? customer(args) : type === String(PayableType.PurchaseOrderInvoice) ? purchase(args) : type === String(PayableType.ShipmentInvoice) ? shipment(args) : billing(args);
    const abort = () => request.abort(); signal.addEventListener("abort", abort, { once: true });
    try { return payableOptions(await request.unwrap(), page); }
    finally { signal.removeEventListener("abort", abort); }
  }, [type, billing, shipment, purchase, customer]);
}
