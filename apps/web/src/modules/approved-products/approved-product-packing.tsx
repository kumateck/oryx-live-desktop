import { useMemo } from "react";
import { z } from "zod";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PackingStyleSection } from "@/modules/products/packing-styles";
import { productsApi } from "@/shared/api/generated/products";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { approvedProductsPath } from "./approved-products";

const audit = { module: "Warehouse", subModule: "Approved Products" } as const;
const { useGetApiV1ProductByProductIdQuery } = productsApi;
const productSchema = z.object({ name: z.string().nullish(), code: z.string().nullish(), fullBatchSize: z.number().nullish(), baseUoM: z.object({ symbol: z.string().nullish() }).nullish() });

/**
 * The packing styles of one approved product, for the finished goods warehouse. It shows the same styles as the
 * product edit page; people with the approved-product packing permission can add, edit and remove them here.
 */
export function ApprovedProductPackingPage() {
  const { id = "" } = useParams();
  const query = useGetApiV1ProductByProductIdQuery({ ...audit, productId: id }, { skip: !id });
  const product = useMemo(() => { const parsed = productSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading packing styles" groups={1} />;
  if (!product) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Product unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a product the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={approvedProductsPath}>Approved products</Link></Button></div></div>;
  const name = product.name?.trim() || "Product";
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${name} packing styles`} crumbs={[{ label: "Approved products", to: approvedProductsPath }, { label: name, to: `${approvedProductsPath}/${id}` }, { label: "Packing styles" }]} />
    <p className="text-sm text-muted-foreground">{product.code?.trim() || "No code"}</p>
    <PackingStyleSection productId={id} fullBatchSize={product.fullBatchSize ?? null} baseUnit={product.baseUoM?.symbol ?? null} saveAs="approved-product" />
  </article>;
}
