import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { productTabs } from "../../lib/product-detail";
import type { ProductDetail } from "../../schemas/product-detail-schema";
import { ActiveBomTab, OutdatedBomsTab } from "./bom-table";
import { PackagingTab, PackingStylesTab } from "./packaging-tabs";
import { ProcedureTab } from "./procedure-tab";
import { ArdTab, SpecificationsTab, StpTab } from "./quality-tabs";

export function ProductTabs({ product }: { product: ProductDetail }) {
  const [active, select] = useTabParam(productTabs, "bom");
  return <Tabs label="Product records" tabs={productTabs} active={active} onSelect={select}>
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
