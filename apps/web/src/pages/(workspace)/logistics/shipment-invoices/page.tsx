import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetApiV1ProcurementShipmentInvoiceQuery } from "@/modules/shipment-invoices/api/invoice-api";
import { InvoicesTable } from "@/modules/shipment-invoices/components/invoices-table";
import { audit, createInvoicePath, invoicePath, invoicePermissions } from "@/modules/shipment-invoices/lib/invoice-access";
import { invoiceRowsSchema } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { useAccess } from "@/shared/auth/use-access";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";

export default function ShipmentInvoicesPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("shipment invoices", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProcurementShipmentInvoiceQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? invoiceRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">LOGISTICS</p><h1 className="text-xl font-semibold">Shipment invoices</h1></div>
      {has(invoicePermissions.create) ? <Button asChild size="sm"><Link to={createInvoicePath}><Plus />Record invoice</Link></Button> : null}
    </div>
    <InvoicesTable rows={rows} search={search} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onOpen={(row) => void navigate(invoicePath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned invoices the app could not read." : null}
      paging={{ page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange }} />
  </section>;
}
