import type { AccessRule } from "@/shared/auth/access";
import { Store, storeIds } from "./stores";

// Per-store workflow permission keys, the same ones the server checks (APP/Services/Stores/StoreWorkflowAccess.cs).
export type StoreWorkflow = "stockRequisitions" | "issueStock" | "returnItems" | "damageMissing" | "purchaseRequisitions";
export type WorkflowAction = "view" | "create" | "edit" | "delete";

const names = ["It", "General", "Equipment", "Reagent"] as const;

export function workflowKey(store: Store, workflow: StoreWorkflow, action: WorkflowAction): string | null {
  const n = names[store];
  switch (workflow) {
    case "stockRequisitions": return action === "view" ? `CanView${n}StoreStockRequisitions` : action === "create" ? `CanCreate${n}StoreStockRequisition` : null;
    case "issueStock": return action === "view" ? `CanView${n}StoreIssueStocks` : action === "create" ? `CanCreate${n}StoreIssueStock` : null;
    case "returnItems": return { view: `CanView${n}StoreReturnItems`, create: `CanCreate${n}StoreReturnItem`, edit: `CanEdit${n}StoreReturnItem`, delete: `CanDelete${n}StoreReturnItem` }[action];
    case "damageMissing": return { view: `CanView${n}StoreDamageMissingItems`, create: `CanCreate${n}StoreDamageMissingItemRecord`, edit: `CanEdit${n}StoreDamageMissingItemRecord`, delete: `CanDelete${n}StoreDamageMissingItemRecord` }[action];
    case "purchaseRequisitions": return { view: `CanView${n}StorePurchaseRequisitions`, create: `CanCreate${n}StorePurchaseRequisition`, edit: `CanEdit${n}StorePurchaseRequisition`, delete: `CanDelete${n}StorePurchaseRequisition` }[action];
  }
}

/** The workflow's view key plus the action's key in one store; a key that does not exist denies. */
export function workflowRule(store: Store, workflow: StoreWorkflow, action: WorkflowAction): AccessRule {
  const view = workflowKey(store, workflow, "view");
  const key = workflowKey(store, workflow, action);
  return { kind: "all", permissions: view && key ? [...new Set([view, key])] : [] };
}

/** Viewing the workflow in at least one store. */
export function workflowAnyStore(...workflows: StoreWorkflow[]): AccessRule {
  return { kind: "some", permissions: workflows.flatMap((w) => storeIds.map((s) => workflowKey(s, w, "view")).filter((k): k is string => Boolean(k))) };
}

/** The `?storeType=` choice of a store-scoped page: each store needs one of the workflows' view keys. */
export function workflowStoreQuery(...workflows: StoreWorkflow[]) {
  return {
    key: "storeType",
    // General store first, as the other store pages order them.
    choices: [Store.General, Store.IT, Store.Equipment, Store.Reagent].map((store) => ({
      value: String(store),
      access: { kind: "some", permissions: workflows.map((w) => workflowKey(store, w, "view")).filter((k): k is string => Boolean(k)) } as AccessRule,
    })),
  } as const;
}

export const storeWorkflowLink = (root: string, store: Store, suffix = "") => `${root}${suffix}?storeType=${String(store)}`;
