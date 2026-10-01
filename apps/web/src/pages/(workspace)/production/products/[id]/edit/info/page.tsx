import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { EditProductInfoForm } from "../../../../../../../modules/products/components/form/edit-product-info-form";
import { ProductFormShell, productFormSections } from "../../../../../../../modules/products/components/form/form-shell";
import { useProductFormSource } from "../../../../../../../modules/products/hooks/use-product-form-source";
import { useProductOptions } from "../../../../../../../modules/products/hooks/use-product-options";
import { productsPath } from "../../../../../../../modules/products/lib/product-access";

export default function EditProductInfoPage() {
  const { id } = useParams();
  const { product, loading, notFound, error, retry } = useProductFormSource(id);
  const options = useProductOptions();
  if (loading) return <FormPageSkeleton label="Loading product" sections={productFormSections} />;
  if (!product) return <div role="alert" className="space-y-2 text-sm">
    <p>{notFound ? "This product could not be found. It may have been removed." : `This product could not be loaded. ${error ?? ""}`}</p>
    <div className="flex gap-2">
      {notFound ? null : <Button type="button" size="sm" variant="outline" onClick={retry}>Retry</Button>}
      <Button asChild size="sm"><Link to={productsPath}>Planned products</Link></Button>
    </div>
  </div>;
  return <ProductFormShell options={options}><EditProductInfoForm key={product.id} product={product} options={options} /></ProductFormShell>;
}
