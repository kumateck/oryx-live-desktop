import type { ModuleManifest } from "../contract";
import { anyReportKey } from "./lib/report-keys";

export const manifest = {
  id: "reports", label: "Reports", root: "/reports", order: 95,
  // The hub serves many reports, each with its own key: any one report key opens it, and the hub lists only
  // the reports the user holds. Old department pages only redirect into the hub, so they follow the same rule.
  access: { kind: "some", permissions: [...anyReportKey] },
  routes: [
    // One page serves every report. Opening it needs a report key; the page then checks the chosen report's
    // own key before anything loads, and each Summary/Detail view is checked separately.
    { pattern: "/reports/:report", access: { kind: "some", permissions: [...anyReportKey] } },
  ],
} satisfies ModuleManifest<"reports", "/reports">;
