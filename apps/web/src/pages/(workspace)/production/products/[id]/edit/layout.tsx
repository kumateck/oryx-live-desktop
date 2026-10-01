import { Outlet, useParams } from "react-router";
import { ProductEditNav } from "../../../../../../modules/products/components/form/product-edit-nav";
import { useProductFormSource } from "../../../../../../modules/products/hooks/use-product-form-source";

export default function ProductEditLayout() {
  const { id } = useParams();
  const { product, loading } = useProductFormSource(id);
  return <section className="min-w-0 space-y-4">
    {id ? <ProductEditNav productId={id} name={product?.name || null} loading={loading} /> : null}
    <Outlet />
  </section>;
}
