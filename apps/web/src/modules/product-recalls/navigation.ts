import type { NavigationGroup } from "../navigation/navigation-model";
/** Domain-owned entry; remains idempotent when the upstream catalogue gains the same route. */
export function withProductRecalls(groups: readonly NavigationGroup[]): NavigationGroup[] {
  return groups.map((group) => group.id !== "fg-warehouse" || group.items.some((item) => item.path === "/warehouse/product-recalls") ? group : {
    ...group, items: [...group.items, { id: "fg-warehouse.product-recalls", label: "Product recalls", path: "/warehouse/product-recalls", permissions: ["CanViewProductRecalls"] }],
  });
}
