import { useMemo } from "react";
import { useAccess } from "@/shared/auth/use-access";
import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { useProductWorkspace } from "../../hooks/use-product-workspace";
import { productTabs } from "../../lib/product-detail";
import type { ProductDetail } from "../../schemas/product-detail-schema";
import { ActiveBomTab, OutdatedBomsTab } from "./bom-table";
import { PackagingTab, PackingStylesTab } from "./packaging-tabs";
import { ProcedureTab } from "./procedure-tab";
import { ArdTab, SpecificationsTab, StpTab } from "./quality-tabs";

/** Each tab opens with its own view key in the current context (Production or QA). */
function useVisibleTabs() {
  const { keys } = useProductWorkspace();
  const { has } = useAccess();
  return useMemo(() => {
    const view: Record<(typeof productTabs)[number]["id"], string | undefined> = {
      bom: keys.sections.bom.view, "outdated-boms": keys.sections.bom.view, packaging: keys.sections.packaging.view,
      "packing-styles": keys.sections.packingStyle.view, procedure: keys.sections.procedure.view, stp: keys.stps,
      specifications: keys.specifications, ard: keys.ards,
    };
    return productTabs.filter((tab) => { const key = view[tab.id]; return key ? has(key) : false; });
  }, [keys, has]);
}

export function ProductTabs({ product }: { product: ProductDetail }) {
  const tabs = useVisibleTabs();
  const [active, select] = useTabParam(tabs, tabs[0]?.id ?? "bom");
  if (tabs.length === 0) return <p className="text-sm text-muted-foreground">You have no permission to view this product's records.</p>;
  return <Tabs label="Product records" tabs={tabs} active={active} onSelect={select}>
    {active === "bom" ? <ActiveBomTab product={product} /> :
      active === "outdated-boms" ? <OutdatedBomsTab product={product} /> :
        active === "packaging" ? <PackagingTab product={product} /> :
          active === "packing-styles" ? <PackingStylesTab product={product} /> :
            active === "procedure" ? <ProcedureTab productId={product.id} /> :
              active === "stp" ? <StpTab productId={product.id} /> :
                active === "specifications" ? <SpecificationsTab productId={product.id} /> :
                  <ArdTab productId={product.id} />}
  </Tabs>;
}
