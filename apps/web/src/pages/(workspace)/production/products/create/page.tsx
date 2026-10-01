import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { CreateProductForm } from "../../../../../modules/products/components/form/create-product-form";
import { ProductFormShell } from "../../../../../modules/products/components/form/form-shell";
import { useProductOptions } from "../../../../../modules/products/hooks/use-product-options";
import { productsPath } from "../../../../../modules/products/lib/product-access";

export default function CreateProductPage() {
  const options = useProductOptions();
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PRODUCTION</p><h1 className="text-xl font-semibold">Create product</h1></div>
      <Button asChild variant="outline" size="sm"><Link to={productsPath}>Back to planned products</Link></Button>
    </div>
    <ProductFormShell options={options}><CreateProductForm options={options} /></ProductFormShell>
  </section>;
}
