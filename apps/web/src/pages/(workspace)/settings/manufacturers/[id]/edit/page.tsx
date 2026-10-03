import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProcurementManufacturerByManufacturerIdQuery } from "@/modules/manufacturers/api/manufacturer-api";
import { ManufacturerEditor } from "@/modules/manufacturers/components/manufacturer-editor";
import { manufacturerAudit } from "@/modules/manufacturers/lib/manufacturer-access";

export default function EditManufacturerPage() {
  const { id } = useParams();
  const query = useGetApiV1ProcurementManufacturerByManufacturerIdQuery({ ...manufacturerAudit, manufacturerId: id ?? "" }, { skip: !id });
  return <section className="min-w-0 space-y-4"><PageHeader title="Edit manufacturer" crumbs={[{ label: "Manufacturers", to: "/settings/manufacturers" }, { label: "Edit" }]} />
    {query.isLoading ? <FormPageSkeleton label="Loading manufacturer" sections={[5, 4]} /> : query.data ? <ManufacturerEditor key={query.data.id} manufacturer={query.data} /> :
      <div role="alert" className="space-y-2"><p>{id ? apiErrorMessage(query.error) : "Invalid manufacturer address"}</p>
        {id ? <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button> : null}</div>}</section>;
}
