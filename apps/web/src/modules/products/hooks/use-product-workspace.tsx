import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router";
import type { PermissionRequirement } from "@/shared/auth/access";
import { productPermissions, productsPath, productDetailPath, productEditPath } from "../lib/product-access";

export const qaProductsPath = "/qa/products";
const productionEdit = { kind: "all", permissions: [productPermissions.edit], departmentType: 0 } as const;
const qaEdit = { kind: "all", permissions: [productPermissions.view, productPermissions.edit] } as const;
interface ProductWorkspace {
  mode: "production" | "qa";
  departmentId: string | null;
  lookupProductId?: string;
  listPath: string;
  detailPath: (id: string) => string;
  editPath: (id: string, tab?: string) => string;
  editRequirement: PermissionRequirement;
}
const production: ProductWorkspace = { mode: "production", departmentId: null, listPath: productsPath,
  detailPath: productDetailPath, editPath: productEditPath, editRequirement: productionEdit };
const ProductWorkspaceContext = createContext<ProductWorkspace>(production);

/** QA owns its selected department in the URL; it never switches the signed-in user's department. */
export function QaProductWorkspace({ children }: { children: ReactNode }) {
  const [search] = useSearchParams();
  const { id } = useParams();
  const departmentId = search.get("departmentId");
  const workspace = useMemo<ProductWorkspace>(() => {
    const query = departmentId ? `?${new URLSearchParams({ departmentId })}` : "";
    return { mode: "qa", departmentId, ...(id ? { lookupProductId: id } : {}), listPath: `${qaProductsPath}${query}`,
      detailPath: productId => `${qaProductsPath}/${productId}/details${query}`,
      editPath: (productId, tab = "info") => `${qaProductsPath}/${productId}/edit/${tab}${query}`,
      editRequirement: qaEdit };
  }, [departmentId, id]);
  return <ProductWorkspaceContext value={workspace}>{children}</ProductWorkspaceContext>;
}
export function useProductWorkspace() { return useContext(ProductWorkspaceContext); }
