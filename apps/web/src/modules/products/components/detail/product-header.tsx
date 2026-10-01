import { Pencil } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { PageBreadcrumbs } from "@/shared/navigation/page-breadcrumbs";
import { formatDateTime } from "@/shared/format/dates";
import { divisionLabel, productEditPath, productPermissions } from "../../lib/product-access";
import type { ProductDetail } from "../../schemas/product-detail-schema";
import { QualityBadge, VerifyProductButton } from "../verify-product-button";

export function ProductHeader({ product }: { product: ProductDetail }) {
  const created = formatDateTime(product.createdAt);
  const division = divisionLabel(product.division);
  return <header className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <PageBreadcrumbs items={[{ label: product.name ?? "Unnamed product" }]} />
      <div className="flex flex-wrap items-center gap-2">
        <PermissionGuard require={productPermissions.verify}><VerifyProductButton product={product} /></PermissionGuard>
        <PermissionGuard require={productPermissions.edit}>
          <Button asChild size="sm" variant="outline"><Link to={productEditPath(product.id)}><Pencil />Edit product</Link></Button>
        </PermissionGuard>
      </div>
    </div>
    <div className="min-w-0 space-y-1.5">
      <p className="break-words text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{product.code ?? "No code"}</span>
        {created ? ` · Created ${created}` : ""}{product.createdBy ? ` by ${product.createdBy}` : ""}
      </p>
      <h1 className="break-words text-xl font-semibold">{product.name ?? "Unnamed product"}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
        {division ? <Badge variant="outline">{division}</Badge> : null}
        <QualityBadge verified={product.isVerified} />
      </div>
    </div>
  </header>;
}
