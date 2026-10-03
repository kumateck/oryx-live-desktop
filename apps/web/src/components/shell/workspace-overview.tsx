import { ChartNoAxesCombined } from "lucide-react";
import { Link } from "react-router";
import { manifest as fgtn } from "@/modules/fgtn-dashboard/manifest";
import { manifest as hr } from "@/modules/hr-dashboard/manifest";
import { manifest as hrSummary } from "@/modules/hr-executive-summary/manifest";
import { manifest as inventory } from "@/modules/inventory-command-center/manifest";
import { manifest as logistics } from "@/modules/logistics-dashboard/manifest";
import { manifest as procurement } from "@/modules/procurement-dashboard/manifest";
import { manifest as production } from "@/modules/production-health-dashboard/manifest";
import { manifest as quality } from "@/modules/qa-qc-dashboard/manifest";
import { manifest as services } from "@/modules/services-dashboard/manifest";
import { manifest as stores } from "@/modules/stores-dashboard/manifest";
import { manifest as warehouse } from "@/modules/warehouse-dashboard/manifest";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";

const dashboards = [hr, hrSummary, quality, warehouse, inventory, procurement, logistics, production, services, stores, fgtn];

/** The home page: a welcome, and the dashboards this user may open. */
export function WorkspaceOverview() {
  const user = useCurrentUser();
  const { can } = useAccess();
  const name = user?.name.replace(/\s+/g, " ").trim();
  const open = dashboards.filter((dashboard) => can(dashboard.access));
  return (
    <div className="overview">
      <div className="eyebrow">WORKSPACE</div>
      <h1>Welcome {name || "there"}</h1>
      <p className="intro">Work smarter with Oryx and skip the back and forth.</p>
      {open.length > 0 ? (
        <section aria-label="Your dashboards" className="space-y-2">
          <h2 className="text-sm font-semibold">Your dashboards</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {open.map((dashboard) => (
              <li key={dashboard.id}>
                <Link to={dashboard.root} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-medium hover:border-primary focus-visible:outline-2">
                  <ChartNoAxesCombined aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />{dashboard.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
