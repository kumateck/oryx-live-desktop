import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ProductsTable } from "../../../../modules/products/components/products-table";
import { useProductsList } from "../../../../modules/products/hooks/use-products-list";
import { productDetailPath, productPermissions, productsPath } from "../../../../modules/products/lib/product-access";

export default function ProductsPage() {
  const list = useProductsList();
  const navigate = useNavigate();
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PRODUCTION</p><h1 className="text-xl font-semibold">Planned products</h1></div>
      <PermissionGuard require={productPermissions.create}><Button asChild size="sm"><Link to={`${productsPath}/create`}>Create</Link></Button></PermissionGuard>
    </div>
    <ProductsTable rows={list.rows} search={list.search} onSearchChange={list.onSearchChange} paging={list.paging} loading={list.loading}
      refreshing={list.refreshing} error={list.error} onRetry={list.retry} onOpen={(product) => void navigate(productDetailPath(product.id))} />
  </section>;
}
