import { Link } from "react-router";
import { useAccess } from "@/shared/auth/use-access";
import { storeIds, stores, type Store } from "./stores";
import { storeWorkflowLink, workflowKey, type StoreWorkflow } from "./workflows";

/** The stores a workflow page can switch between: those whose records the user may read. */
export function WorkflowStoreLinks({ root, store, workflows }: { root: string; store: Store; workflows: readonly StoreWorkflow[] }) {
  const { has } = useAccess();
  const readable = storeIds.filter((s) => workflows.some((w) => { const key = workflowKey(s, w, "view"); return key ? has(key) : false; }));
  if (readable.length < 2) return null;
  return <nav aria-label="Stores" className="flex flex-wrap gap-2">
    {readable.map((s) => <Link key={s} to={storeWorkflowLink(root, s)} aria-current={s === store ? "page" : undefined}
      className={`rounded-md border px-3 py-1.5 text-sm ${s === store ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{stores[s]}</Link>)}
  </nav>;
}
