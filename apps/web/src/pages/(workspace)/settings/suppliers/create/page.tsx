import { PageHeader } from "@/shared/navigation/page-header";
import { SupplierEditor } from "@/modules/suppliers/components/supplier-editor";

export default function CreateSupplierPage() {
  return <section className="min-w-0 space-y-4"><PageHeader title="Create supplier" crumbs={[{ label: "Suppliers", to: "/settings/suppliers" }, { label: "Create" }]} />
    <SupplierEditor /></section>;
}
