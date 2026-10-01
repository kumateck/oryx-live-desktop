import { NavLink } from "react-router";
import { cn } from "cn";
import { PageHeader } from "@/shared/navigation/page-header";
import { productDetailPath, productEditPath } from "../../lib/product-access";
import { productEditTabs } from "../../lib/product-edit-tabs";

/** Heading and section links of the product edit area. Sections not built yet are shown but cannot be opened. */
export function ProductEditNav({ productId, name, loading = false }: { productId: string; name: string | null; loading?: boolean }) {
  return <header className="min-w-0 space-y-3">
    <PageHeader title={loading ? null : name ? `Edit ${name}` : "Edit product"}
      crumbs={[{ label: loading ? null : name ?? "Product", to: productDetailPath(productId) }, { label: "Edit" }]} />
    <nav aria-label="Product sections" className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
      {productEditTabs.map((tab) => tab.ready
        ? <NavLink key={tab.id} to={productEditPath(productId, tab.id)} className={({ isActive }) => cn("rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2",
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{tab.label}</NavLink>
        : <span key={tab.id} aria-disabled="true" title="Not in the desktop app yet. Use the Oryx web application for this section."
          className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-muted-foreground/60">{tab.label}</span>)}
    </nav>
  </header>;
}
