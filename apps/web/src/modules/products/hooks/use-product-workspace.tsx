import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router";
import type { PermissionRequirement } from "@/shared/auth/access";
import { productsPath, productDetailPath, productEditPath } from "../lib/product-access";
import { anyChangeKeys, changeKeys, contextArg, productKeys, type ProductMode, type ProductSection, type SectionKeys } from "../lib/product-keys";

export const qaProductsPath = "/qa/products";
/** Production product pages stay limited to production departments, as in Oryx Next. */
const scope = (mode: ProductMode) => mode === "production" ? { departmentType: 0 as const } : {};
/** One section task: the action's own key. */
function taskRequirement(mode: ProductMode, key: string): PermissionRequirement {
  return { kind: "all", permissions: [key], ...scope(mode) };
}
/** A bulk section save: any change key lets the user save; the server requires the key for each kind of change made. */
function saveRequirement(mode: ProductMode, keys: SectionKeys): PermissionRequirement {
  return { kind: "some", permissions: changeKeys(keys), ...scope(mode) };
}
function sectionAccess(mode: ProductMode) {
  const keys = productKeys[mode];
  return {
    keys,
    context: contextArg(mode),
    task: (key: string) => taskRequirement(mode, key),
    save: (section: ProductSection) => saveRequirement(mode, keys.sections[section]),
    // The edit pages serve every section; any change key opens them and each section checks its own.
    editRequirement: { kind: "some", permissions: anyChangeKeys(mode), ...scope(mode) } as PermissionRequirement,
  };
}
interface ProductWorkspace extends ReturnType<typeof sectionAccess> {
  mode: ProductMode;
  departmentId: string | null;
  lookupProductId?: string;
  listPath: string;
  detailPath: (id: string) => string;
  editPath: (id: string, tab?: string) => string;
}
const production: ProductWorkspace = { mode: "production", departmentId: null, listPath: productsPath,
  detailPath: productDetailPath, editPath: productEditPath, ...sectionAccess("production") };
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
      ...sectionAccess("qa") };
  }, [departmentId, id]);
  return <ProductWorkspaceContext value={workspace}>{children}</ProductWorkspaceContext>;
}
export function useProductWorkspace() { return useContext(ProductWorkspaceContext); }
