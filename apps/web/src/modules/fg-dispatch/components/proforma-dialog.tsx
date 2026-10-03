import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { useGetApiV1ConfigurationByModelTypeCountQuery, useLazyGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery, usePostApiV1ProductionOrdersProformaInvoiceMutation } from "../api/dispatch-api";
import { invoiceAudit, proformaNumber, proformaPath, proformaPrefix } from "../lib/dispatch";
import { allocationSchema, type Allocation } from "../schemas/dispatch-schema";
import { InvoiceLines } from "./invoice-lines";
import { usePricedLines } from "./use-priced-lines";

/**
 * Raises the proforma invoice for an allocation. The invoice is created only when Generate is pressed, never by
 * printing, and only for an allocation that is itself approved; the approval is read again just before it is sent.
 */
export function ProformaDialog({ allocation, onClose }: { allocation: Allocation; onClose: () => void }) {
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const count = useGetApiV1ConfigurationByModelTypeCountQuery({ ...invoiceAudit, modelType: "ProformaInvoice", prefix: proformaPrefix(today.getFullYear()) });
  const number = typeof count.data === "number" ? proformaNumber(count.data, today.getFullYear()) : "";
  const [reload, reloading] = useLazyGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery();
  const [save, saving] = usePostApiV1ProductionOrdersProformaInvoiceMutation();
  const [message, setMessage] = useState("");
  const fresh = useMemo(() => { const parsed = allocationSchema.safeParse(reloading.data ?? null); return parsed.success && parsed.data ? parsed.data : allocation; }, [reloading.data, allocation]);
  const priced = usePricedLines(fresh, null, today.toISOString());
  const dueDays = fresh.customer.dueDays ?? 30;
  const due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dueDays);
  const busy = saving.isLoading || reloading.isFetching;
  const ready = fresh.approved && Boolean(number) && !priced.loading && !priced.unavailable;
  const generate = async () => {
    setMessage("");
    // The allocation may have been approved, or changed, since the page was opened.
    const check = await reload({ ...invoiceAudit, allocateProductionOrderId: allocation.id });
    const current = allocationSchema.safeParse(check.data ?? null);
    if (check.error || !current.success || !current.data) { setMessage(check.error ? apiErrorMessage(check.error) : "The allocation could not be read again."); return; }
    if (!current.data.approved) { setMessage("This allocation is still waiting for its own approval, so it cannot be invoiced yet."); return; }
    if (current.data.hasInvoice) { setMessage("A proforma invoice has already been raised for this allocation."); return; }
    const result = await save({ ...invoiceAudit, domainEntitiesProformaInvoicesCreateProformaInvoice: { code: number, allocateProductionOrderId: current.data.id,
      products: current.data.products.flatMap((product) => product.productId ? [{ productId: product.productId, quantity: product.quantity }] : []) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`Proforma invoice ${number} raised`);
    onClose();
    if (typeof result.data === "string" && result.data) void navigate(`${proformaPath}/${result.data}`);
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>Proforma invoice · order {fresh.orderCode ?? "–"}</DialogTitle><DialogDescription>Check the lines and prices. The invoice is raised when you press Generate.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-md border p-3"><h3 className="mb-1 text-xs font-medium text-muted-foreground">Bill to</h3>{[fresh.customer.name, fresh.customer.address, fresh.customer.email, fresh.customer.phone].filter(Boolean).map((line) => <p key={line} className="break-words">{line}</p>)}</div>
          <div className="rounded-md border p-3"><h3 className="mb-1 text-xs font-medium text-muted-foreground">Invoice</h3><p>Number {number || (count.error ? "could not be generated" : "…")}</p><p>Date {formatDate(today.toISOString())}</p><p>Due {formatDate(due.toISOString())} · {dueDays} days</p></div>
        </div>
        <InvoiceLines lines={priced.lines} loading={priced.loading} unavailable={priced.unavailable} />
        <p className="text-xs text-muted-foreground">Payment is due within {dueDays} days. This proforma invoice is subject to quality approval.</p>
        {!fresh.approved ? <div role="status" className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm"><span>This allocation is waiting for its own approval. Approval of the production order alone does not allow it to be invoiced.</span>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void reload({ ...invoiceAudit, allocateProductionOrderId: allocation.id })}><RefreshCw className={reloading.isFetching ? "animate-spin" : undefined} />Check again</Button></div> : null}
        {count.error ? <p role="alert" className="text-sm text-destructive">The invoice number could not be generated, so the invoice cannot be raised. {apiErrorMessage(count.error)}</p> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="button" disabled={busy || !ready} onClick={() => void generate()}>{busy ? <><Spinner />Working…</> : "Generate proforma invoice"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
