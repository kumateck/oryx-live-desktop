import { useAccess } from "@/shared/auth/use-access";
import { productPermissions } from "../lib/product-access";

export function useProductAccess() {
  const { has } = useAccess();
  return { view: has(productPermissions.view), create: has(productPermissions.create), verify: has(productPermissions.verify) };
}

export type ProductAccess = ReturnType<typeof useProductAccess>;
