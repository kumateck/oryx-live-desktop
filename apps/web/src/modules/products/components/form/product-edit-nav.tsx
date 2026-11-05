import { useProductWorkspace } from "../../hooks/use-product-workspace";
import { useAccess } from "@/shared/auth/use-access";
import { productArdPermissions, productSpecificationPermissions, productStpPermissions } from "../../lib/product-access";
import type { ProductSection } from "../../lib/product-keys";
import { NavLink } from "react-router";
import { cn } from "cn";
import { PageHeader } from "@/shared/navigation/page-header";
import { productEditPath } from "../../lib/product-access";
import { productEditTabs } from "../../lib/product-edit-tabs";

/** Heading and section links of the product edit area. Sections not built yet are shown but cannot be opened. */
export function ProductEditNav({ productId, name, loading = false }: { productId: string; name: string | null; loading?: boolean }) {
  const { detailPath: productDetailPath, editPath: productEditPath, save, task, keys } = useProductWorkspace();
  const access = useAccess();
  // A section shows when the user can change it; spec, STP and ARD use QC's own document keys.
  const sections: Partial<Record<(typeof productEditTabs)[number]["id"], ProductSection>> = { info: "info", "packing-style": "packingStyle", bom: "bom",
    packaging: "packaging", procedure: "procedure", "packing-order": "packingOrder" };
  const visible = productEditTabs.filter((tab) => {
    const section = sections[tab.id];
    if (section) return access.allows(section === "info" || section === "packingOrder" ? task(keys.sections[section].edit) : save(section));
    if (tab.id === "spec") return access.allows({ kind: "some", permissions: [productSpecificationPermissions.create, productSpecificationPermissions.edit] });
    if (tab.id === "ard") return access.allows({ kind: "some", permissions: [productArdPermissions.create, productArdPermissions.edit] });
    return access.allows({ kind: "some", permissions: [productStpPermissions.create, productStpPermissions.edit] });
  });
  return <header className="min-w-0 space-y-3">
    <PageHeader title={loading ? null : name ? `Edit ${name}` : "Edit product"}
      crumbs={[{ label: loading ? null : name ?? "Product", to: productDetailPath(productId) }, { label: "Edit" }]} />
    <nav aria-label="Product sections" className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
      {visible.map((tab) => tab.ready
        ? <NavLink key={tab.id} to={productEditPath(productId, tab.id)} className={({ isActive }) => cn("rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2",
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{tab.label}</NavLink>
        : <span key={tab.id} aria-disabled="true" title="Not in the desktop app yet. Use the Oryx web application for this section."
          className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-muted-foreground/60">{tab.label}</span>)}
    </nav>
  </header>;
}
