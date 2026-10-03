import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";

/** Foreign and local suppliers are handled as separate lists behind separate permissions. */
export type SupplierType = 0 | 1;
export const supplierTypeLabels: Record<SupplierType, string> = { 0: "Foreign", 1: "Local" };

/** The supplier types the user may see and the one that is open, kept in the address as `?type=`. */
export const useSupplierTypeTabs = useKindTabs;

export function SupplierTypeSwitch({ tabs }: { tabs: ReturnType<typeof useKindTabs> }) {
  return <KindSwitch tabs={tabs.tabs} kind={tabs.kind} onSelect={tabs.select} labels={supplierTypeLabels} label="Supplier type" />;
}
