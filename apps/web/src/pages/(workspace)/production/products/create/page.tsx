import { PageHeader } from "@/shared/navigation/page-header";
import { CreateProductForm } from "../../../../../modules/products/components/form/create-product-form";
import { ProductFormShell } from "../../../../../modules/products/components/form/form-shell";
import { useProductOptions } from "../../../../../modules/products/hooks/use-product-options";

export default function CreateProductPage() {
  const options = useProductOptions();
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Create product" crumbs={[{ label: "Create" }]} />
    <ProductFormShell options={options}><CreateProductForm options={options} /></ProductFormShell>
  </section>;
}
