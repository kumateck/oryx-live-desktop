import { useAccess } from "@/shared/auth/use-access";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { agreementsPath, costingPath } from "../lib/costing";

const views = [{ to: costingPath, label: "Price-list revisions", end: true, permission: "CanViewCostingPriceList" }, { to: agreementsPath, label: "Customer agreements", end: false, permission: "ManageCosting" }] as const;

/** Switches between the two costing lists. Each is its own address, so either can be linked to. */
export function CostingTabs() {
  const { has } = useAccess();
  return <nav aria-label="Costing views" className="flex flex-wrap gap-1 border-b">
    {views.filter((view) => has(view.permission)).map((view) => <NavLink key={view.to} to={view.to} end={view.end} className={({ isActive }) => cn("-mb-px border-b-2 px-3 py-1.5 text-sm", isActive ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{view.label}</NavLink>)}
  </nav>;
}
