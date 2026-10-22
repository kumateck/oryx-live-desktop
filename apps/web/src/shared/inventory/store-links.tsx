import { Link } from "react-router";
import { useAccess } from "@/shared/auth/use-access";
import { itemPermissions, stockPermissions, storeIds, stores, inventoryLink, stockLink, type Store } from "./stores";
export function StoreLinks({ store, scope = "items" }: { store: Store; scope?: "items" | "available" | "receiving" }) {
  const { has } = useAccess();
  return (
    <nav aria-label="Inventory stores" className="flex flex-wrap gap-2">
      {storeIds
        .filter((s) => has(scope === "items" ? itemPermissions(s).view : stockPermissions(s)[scope]))
        .map((s) => (
          <Link
            key={s}
            to={scope === "items" ? inventoryLink(s) : stockLink(s, scope)}
            aria-current={s === store ? "page" : undefined}
            className={`rounded-md border px-3 py-2 text-sm ${s === store ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {stores[s]}
          </Link>
        ))}
    </nav>
  );
}
