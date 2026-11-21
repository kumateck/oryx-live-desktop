import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { useAccess } from "@/shared/auth/use-access";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDateTime } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintButton } from "@/shared/print/print-button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useGetApiV1FinishedGoodsAllocationsByIdDocumentsQuery } from "../api/goods-api";
import { audit, proformaInvoicePath } from "../lib/dispatch";
import type { Allocation } from "../schemas/dispatch-schema";
const WaybillPrint = lazy(() => import("./waybill-print"));

export function AllocationDocuments({ allocation }: { allocation: Allocation }) {
  const { has } = useAccess();
  const query = useGetApiV1FinishedGoodsAllocationsByIdDocumentsQuery({ ...audit, id: allocation.id }, { skip: !has("CanViewInvoice") });
  if (!has("CanViewInvoice")) return null;
  if (query.isLoading) return <Skeleton className="h-32 w-full" />;
  if (query.error) return <p role="alert">{apiErrorMessage(query.error)}</p>;
  const documents = query.data;
  return <div className="space-y-3">
    <DetailGroup title="Commercial and transport documents">
      <DetailItem label="Proforma" value={documents?.proformaId && has("CanViewProformaInvoice") ? <Link className="text-primary underline" to={proformaInvoicePath(documents.proformaId)}>{documents.proformaCode ?? "Open proforma"}</Link> : documents?.proformaCode ?? "Pending"} />
      <DetailItem label="Customer PO" value={documents?.customerPoNumber ?? "Pending verification"} />
      <DetailItem label="PO verified" value={formatDateTime(documents?.customerPoVerifiedAt) ?? "Pending"} />
      <DetailItem label="Issued invoice" value={documents?.invoiceCode ?? "Pending issue"} />
      <DetailItem label="Waybill" value={documents?.waybillCode ?? "Pending"} />
      <DetailItem label="Transporter / vehicle" value={[documents?.transporter, documents?.vehicle].filter(Boolean).join(" · ")} />
      <DetailItem label="Driver / contact" value={[documents?.driver, documents?.driverPhone].filter(Boolean).join(" · ")} />
      <DetailItem label="Delivery address" value={documents?.deliveryAddress} />
      <DetailItem label="Transport conditions / seal" value={[documents?.storageConditions, documents?.seal].filter(Boolean).join(" · ")} />
    </DetailGroup>
    {documents?.waybillId && has("CanPrintFinishedGoodsWaybill") ? <PrintButton label="Print waybill" preview={(close) => <Suspense fallback={<Skeleton className="h-40 w-full" />}><WaybillPrint id={allocation.id} onClose={close} /></Suspense>} /> : null}
    <DetailGroup title="Invoice history">{(documents?.invoiceHistory ?? []).map((invoice) => <DetailItem key={invoice.id} label={invoice.code ?? "Invoice"}
      value={invoice.voided ? `Voided ${formatDateTime(invoice.voidedAt) ?? ""} · ${invoice.voidReason ?? ""}` : `Issued ${formatDateTime(invoice.createdAt) ?? ""}`} />)}</DetailGroup>
    <DetailGroup title="Approved manufacturing cost basis">
      <DetailItem label="Confirmed" value={formatDateTime(documents?.costingConfirmedAt) ?? "Pending Costing confirmation"} />
      {(documents?.costingLines ?? []).map((line) => <DetailItem key={`${line.productId}/${line.productPackingId}`}
        label={`${allocation.products.find((p) => p.productId === line.productId && p.packingId === line.productPackingId)?.name ?? "Product"} · per complete pack`}
        value={`${line.currencyLabel ?? ""} ${line.manufacturingCostPerPack ?? 0} · ${line.approvedCostBasisReference ?? ""}`} />)}
    </DetailGroup>
    {allocation.fefoExceptionReason ? <DetailGroup title="FEFO exception"><DetailItem label="Authorised reason" value={allocation.fefoExceptionReason} /></DetailGroup> : null}
  </div>;
}
