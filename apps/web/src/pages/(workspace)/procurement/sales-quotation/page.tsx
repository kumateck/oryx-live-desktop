import { useState } from "react";
import { RecordPricesDialog } from "@/modules/quotation-responses/components/record-prices-dialog";
import { SupplierQuotationsTable } from "@/modules/quotation-responses/components/supplier-quotations-table";
import { useSupplierQuotations } from "@/modules/quotation-responses/hooks/use-supplier-quotations";
import { recordResponsePermissions, viewResponsePermissions } from "@/modules/quotation-responses/lib/quotation-response-access";
import type { SupplierQuotation } from "@/modules/quotation-responses/schemas/quotation-response-schema";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { DoneFilter, useDoneFilter } from "@/shared/procurement/sent-filter";
import { SupplierTypeSwitch, useSupplierTypeTabs } from "@/shared/procurement/supplier-type";

export default function QuotationResponsesPage() {
  const types = useSupplierTypeTabs(viewResponsePermissions);
  const filter = useDoneFilter("received");
  const list = useSupplierQuotations(types.kind, filter.done);
  const { has } = useAccess();
  const [open, setOpen] = useState<SupplierQuotation | null>(null);
  if (types.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Quotation responses</h1></div>
      <div className="flex flex-wrap items-center gap-3">
        <DoneFilter label="Response status" waiting="Awaiting prices" done="Recorded" value={filter.done} onSelect={filter.select} />
        <SupplierTypeSwitch tabs={types} />
      </div>
    </div>
    <SupplierQuotationsTable rows={list.rows} received={filter.done} recordPermission={recordResponsePermissions[types.kind]} paging={list.paging} loading={list.loading} refreshing={list.refreshing}
      error={list.error} onRetry={list.retry} onOpen={setOpen} />
    {/* Keyed by quotation so each one starts from its own prices. */}
    {open ? <RecordPricesDialog key={open.id} quotation={open} type={types.kind} inView={list.rows} mayRecord={has(recordResponsePermissions[types.kind])} onClose={() => setOpen(null)} /> : null}
  </section>;
}
