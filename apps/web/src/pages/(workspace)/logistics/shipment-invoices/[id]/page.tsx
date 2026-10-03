import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetApiV1ProcurementShipmentInvoiceByIdQuery } from "@/modules/shipment-invoices/api/invoice-api";
import { InvoiceDetail } from "@/modules/shipment-invoices/components/invoice-detail";
import { audit, invoicesPath } from "@/modules/shipment-invoices/lib/invoice-access";
import { invoiceSchema } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

function Invoice({ id }: { id: string }) {
  const query = useGetApiV1ProcurementShipmentInvoiceByIdQuery({ ...audit, id });
  const invoice = useMemo(() => { const parsed = invoiceSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading invoice" />;
  if (!invoice) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Invoice unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned an invoice the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={invoicesPath}>All invoices</Link></Button></div></div>;
  return <InvoiceDetail invoice={invoice} />;
}

export default function ShipmentInvoicePage() {
  const { id } = useParams();
  return id ? <Invoice id={id} /> : null;
}
