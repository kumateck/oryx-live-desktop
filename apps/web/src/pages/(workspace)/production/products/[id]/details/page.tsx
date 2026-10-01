import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProductHeader } from "../../../../../../modules/products/components/detail/product-header";
import { ProductSummary } from "../../../../../../modules/products/components/detail/product-summary";
import { ProductTabs } from "../../../../../../modules/products/components/detail/product-tabs";
import { useProductDetail } from "../../../../../../modules/products/hooks/use-product-detail";
import { productsPath } from "../../../../../../modules/products/lib/product-access";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { product, loading, notFound, error, retry } = useProductDetail(id);
  if (loading) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading product…</p>;
  if (!product) return <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
    <h1 className="text-xl font-semibold">{notFound ? "This product could not be found" : "This product could not be loaded"}</h1>
    <p className="text-sm text-muted-foreground">{notFound ? "It may have been removed, or the link is incorrect." : error}</p>
    <div className="flex gap-2">
      {notFound ? null : <Button type="button" size="sm" variant="outline" onClick={retry}>Retry</Button>}
      <Button asChild size="sm"><Link to={productsPath}>Planned products</Link></Button>
    </div>
  </div>;
  return <article className="min-w-0 space-y-5">
    <ProductHeader product={product} />
    <ProductSummary product={product} />
    <ProductTabs product={product} />
  </article>;
}
