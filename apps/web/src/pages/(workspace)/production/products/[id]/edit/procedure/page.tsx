import { useParams } from "react-router";
import { ProcedureSection } from "../../../../../../../modules/products/components/procedure/procedure-section";
import { useProductFormSource } from "../../../../../../../modules/products/hooks/use-product-form-source";
import { PageSkeleton } from "../../../../../../../shared/skeleton/page-skeletons";

export default function EditProductProcedurePage() {
  const { id } = useParams();
  const { product, loading } = useProductFormSource(id);
  if (!id) return null;
  // Operations depend on the product's department, so the section waits for the product.
  if (loading) return <PageSkeleton label="Loading procedure" />;
  return <ProcedureSection productId={id} departmentId={product?.department?.value ?? null} />;
}
