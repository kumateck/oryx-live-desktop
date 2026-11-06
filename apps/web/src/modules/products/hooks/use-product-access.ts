import { useAccess } from "@/shared/auth/use-access";
import { productPermissions } from "../lib/product-access";
import { useProductWorkspace } from "./use-product-workspace";

export function useProductAccess() {
  const { has } = useAccess();
  // The list and creation follow the page's context: QA lists with its own key and does not create products.
  const { keys } = useProductWorkspace();
  return { view: has(keys.list), create: keys.create ? has(keys.create) : false, verify: has(productPermissions.verify) };
}

export type ProductAccess = ReturnType<typeof useProductAccess>;
