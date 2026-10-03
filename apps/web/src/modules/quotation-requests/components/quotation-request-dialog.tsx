import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAccess } from "@/shared/auth/use-access";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { PrintButton } from "@/shared/print/print-button";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1RequisitionPendingBySupplierIdQuery, usePostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationMutation } from "../api/quotation-request-api";
import { audit, sendBlock } from "../lib/quotation-request-access";
import type { QuotationRequest, QuotationRequestLine } from "../schemas/quotation-request-schema";
import { QuotationRequestPrint } from "./quotation-request-print";

const column = dataTableColumns<QuotationRequestLine>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
    <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.accessor((row) => row.manufacturer ?? "", { id: "manufacturer", header: "Manufacturer", cell: ({ row }) => row.original.manufacturer ?? <span className="text-muted-foreground">Not set</span> }),
  column.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
]);

/** What a supplier is asked to quote for. Sending it is a separate, deliberate step: the server emails the request as a PDF. */
export function QuotationRequestDialog({ request, sendPermission, onClose }: { request: QuotationRequest; sendPermission: string; onClose: () => void }) {
  const { has } = useAccess();
  const maySend = !request.sentAt && has(sendPermission) && Boolean(request.supplier.id);
  const pending = useGetApiV1RequisitionPendingBySupplierIdQuery({ ...audit, supplierId: request.supplier.id ?? "" }, { skip: !maySend });
  const [send, mutation] = usePostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationMutation();
  const [message, setMessage] = useState("");
  const block = useMemo(() => maySend ? sendBlock({ email: request.supplier.email, itemCount: request.items.length }, pending.data === true) : null, [maySend, request, pending.data]);

  const submit = async () => {
    setMessage("");
    const result = await send({ ...audit, supplierId: request.supplier.id ?? "" });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Quotation request sent", { description: `Emailed to ${request.supplier.email ?? request.supplier.name}.` });
    onClose();
  };
  const busy = mutation.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Quotation request</DialogTitle>
        <DialogDescription>{request.sentAt ? `Sent to the supplier on ${formatDate(request.sentAt) ?? "an unrecorded date"}.` : "The supplier is asked for a price for each of these materials."}</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <SupplierSummary supplier={request.supplier} />
        <ListDataTable label="Requested materials" columns={columns} rows={request.items} getRowId={(row) => row.id} />
        {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter>
        <PrintButton size="default" preview={(close) => <QuotationRequestPrint request={request} onClose={close} />} />
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>{maySend ? "Cancel" : "Close"}</Button>
        {maySend ? <Button type="button" disabled={busy || pending.isLoading || block !== null} onClick={() => void submit()}>{busy ? <><Spinner />Sending…</> : "Send request by email"}</Button> : null}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
