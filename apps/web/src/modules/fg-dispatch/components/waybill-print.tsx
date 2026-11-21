import { useGetApiV1FinishedGoodsAllocationsByIdWaybillPrintQuery } from "../api/goods-api";
import { audit } from "../lib/dispatch";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import type { AppServicesFinishedGoodsFinishedGoodsWaybillLineDto as Line } from "@/shared/api/generated/production";
const columns: readonly PrintColumn<Line>[] = [
  { id: "product", header: "Product", cell: (line) => line.product },
  { id: "packing", header: "Packing style", cell: (line) => line.packingStyle },
  { id: "batch", header: "Batch", cell: (line) => line.batch },
  { id: "expiry", header: "Expiry", cell: (line) => formatDate(line.expiry) },
  { id: "packs", header: "Packs", align: "right", cell: (line) => formatQuantityNumber(line.packs ?? 0, "entered") },
  { id: "units", header: "Base units", align: "right", cell: (line) => formatQuantityNumber(line.baseUnits ?? 0, "calculated") },
];
export default function WaybillPrint({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useGetApiV1FinishedGoodsAllocationsByIdWaybillPrintQuery({ ...audit, id });
  const data = query.data; const documents = data?.documents;
  return <PrintPreviewDialog title={`Waybill · ${documents?.waybillCode ?? ""}`} ready={!query.isFetching && Boolean(data) && !query.error} onClose={onClose}>
    {query.isLoading ? <p>Loading waybill…</p> : query.error ? <p role="alert">{apiErrorMessage(query.error)}</p> : data ? <>
      <PrintHeader title="Waybill" reference={documents?.waybillCode} aside={data.departedAt ? `Departed ${formatDateTime(data.departedAt) ?? ""}` : "Prepared · departure not recorded"} />
      <PrintFacts facts={[{ label: "Customer", value: data.customer }, { label: "Customer contact", value: data.customerPhone }, { label: "Deliver to", value: documents?.deliveryAddress },
        { label: "Production order", value: data.orderCode }, { label: "Proforma", value: documents?.proformaCode }, { label: "Customer PO", value: documents?.customerPoNumber },
        { label: "Invoice", value: documents?.invoiceCode }, { label: "Carrier", value: documents?.transporter }, { label: "Vehicle", value: documents?.vehicle },
        { label: "Driver / contact", value: [documents?.driver, documents?.driverPhone].filter(Boolean).join(" · ") }, { label: "Seal", value: documents?.seal },
        { label: "Storage / transport conditions", value: documents?.storageConditions }, { label: "Gate exit reference", value: data.exitReference }]} />
      <PrintTable columns={columns} rows={data.lines ?? []} rowKey={(_line, index) => String(index)} empty="No consignment lines." />
      <PrintSignatures roles={["Released by warehouse", "Collected by driver", "Received by customer"]} />
    </> : <p role="alert">Waybill unavailable.</p>}
  </PrintPreviewDialog>;
}
