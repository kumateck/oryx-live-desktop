import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProcurementSupplierBySupplierIdQuery } from "@/modules/suppliers/api/supplier-api";
import { useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery } from "@/shared/api/generated/procurement";
import { SupplierEditor } from "@/modules/suppliers/components/supplier-editor";
import { supplierAudit } from "@/modules/suppliers/lib/supplier-access";

export default function EditSupplierPage() {
  const { id } = useParams();
  const query = useGetApiV1ProcurementSupplierBySupplierIdQuery({ ...supplierAudit, supplierId: id ?? "" }, { skip: !id });
  const associations = useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery({ ...supplierAudit, supplierId: id ?? "" }, { skip: !id });
  return <section className="min-w-0 space-y-4"><PageHeader title="Edit supplier" crumbs={[{ label: "Suppliers", to: "/settings/suppliers" }, { label: "Edit" }]} />
    {query.isLoading || associations.isLoading ? <FormPageSkeleton label="Loading supplier" sections={[7, 4]} /> : query.data && associations.data ? <SupplierEditor key={query.data.id} supplier={query.data} associations={associations.data} /> :
      <div role="alert" className="space-y-2"><p>{id ? apiErrorMessage(associations.error ?? query.error) : "Invalid supplier address"}</p>
        {id ? <Button size="sm" variant="outline" onClick={() => { void query.refetch(); void associations.refetch(); }}>Retry</Button> : null}</div>}</section>;
}
