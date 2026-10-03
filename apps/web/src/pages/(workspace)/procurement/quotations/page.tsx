import { useState } from "react";
import { QuotationRequestDialog } from "@/modules/quotation-requests/components/quotation-request-dialog";
import { QuotationRequestsTable } from "@/modules/quotation-requests/components/quotation-requests-table";
import { useQuotationRequests } from "@/modules/quotation-requests/hooks/use-quotation-requests";
import { sendRequestPermissions, viewRequestPermissions } from "@/modules/quotation-requests/lib/quotation-request-access";
import type { QuotationRequest } from "@/modules/quotation-requests/schemas/quotation-request-schema";
import { NoAccess } from "@/shared/auth/no-access";
import { DoneFilter, useDoneFilter } from "@/shared/procurement/sent-filter";
import { SupplierTypeSwitch, useSupplierTypeTabs } from "@/shared/procurement/supplier-type";

export default function QuotationRequestsPage() {
  const types = useSupplierTypeTabs(viewRequestPermissions);
  const filter = useDoneFilter("sent");
  const list = useQuotationRequests(types.kind, filter.done);
  const [open, setOpen] = useState<QuotationRequest | null>(null);
  if (types.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Quotation requests</h1></div>
      <div className="flex flex-wrap items-center gap-3">
        <DoneFilter label="Request status" waiting="To send" done="Sent" value={filter.done} onSelect={filter.select} />
        <SupplierTypeSwitch tabs={types} />
      </div>
    </div>
    <QuotationRequestsTable rows={list.rows} sent={filter.done} sendPermission={sendRequestPermissions[types.kind]} paging={list.paging} loading={list.loading} refreshing={list.refreshing}
      error={list.error} onRetry={list.retry} onOpen={setOpen} />
    {open ? <QuotationRequestDialog request={open} sendPermission={sendRequestPermissions[types.kind]} onClose={() => setOpen(null)} /> : null}
  </section>;
}
