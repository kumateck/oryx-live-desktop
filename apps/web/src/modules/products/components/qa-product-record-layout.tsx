import { Link, Outlet, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useProductFormSource } from "../hooks/use-product-form-source";
import { qaProductsPath, useProductWorkspace } from "../hooks/use-product-workspace";

/** A mismatched bookmark never mounts the product's detail/editor data or actions. */
export function QaProductRecordLayout() {
  const { id } = useParams();
  const { departmentId, listPath } = useProductWorkspace();
  const { product, loading, error, retry } = useProductFormSource(departmentId ? id : undefined);
  if (departmentId && loading) return <DetailPageSkeleton label="Loading product" />;
  if (error || !departmentId || !product || product.department?.value !== departmentId) return <div role="alert" className="space-y-3 text-sm">
    <p>{!departmentId ? "Select a production department before opening a product." : error || "This product is not available in the selected department."}</p>
    {error ? <Button size="sm" variant="outline" onClick={retry}>Retry</Button> : null}
    <Button asChild size="sm"><Link to={departmentId ? listPath : qaProductsPath}>Products</Link></Button>
  </div>;
  return <div className="min-w-0 space-y-3">
    <p className="text-sm text-muted-foreground">Production department: <span className="font-medium text-foreground">{product.department.label}</span></p>
    <Outlet key={`${id}:${departmentId}`} />
  </div>;
}
