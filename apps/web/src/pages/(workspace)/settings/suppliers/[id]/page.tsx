import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProcurementSupplierBySupplierIdQuery } from "@/modules/suppliers/api/supplier-api";
import { SupplierDetail } from "@/modules/suppliers/components/supplier-detail";
import { supplierAudit, suppliersPath } from "@/modules/suppliers/lib/supplier-access";

export default function SupplierDetailPage() {
  const { id } = useParams();
  const query = useGetApiV1ProcurementSupplierBySupplierIdQuery({ ...supplierAudit, supplierId: id ?? "" }, { skip: !id });
  if (!id) return <p role="alert">Invalid supplier address.</p>;
  if (query.isLoading) return <DetailPageSkeleton label="Loading supplier" />;
  if (!query.data) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Supplier unavailable</h1><p className="text-sm text-muted-foreground">{apiErrorMessage(query.error)}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      <Button asChild size="sm"><Link to={suppliersPath}>All suppliers</Link></Button></div></div>;
  return <SupplierDetail supplier={query.data} />;
}
