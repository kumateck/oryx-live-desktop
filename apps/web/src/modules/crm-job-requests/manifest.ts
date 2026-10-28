import type { ModuleManifest } from "../contract";
// Oryx Next's CRM job request page was the services job request list; this address now opens it.
export const manifest = {
  id: "crm-job-requests", label: "Job requests (CRM)", root: "/crm/jobs/job-request", order: 162,
  access: { kind: "all", permissions: ["CanViewJobRequests"] },
} satisfies ModuleManifest<"crm-job-requests", "/crm/jobs/job-request">;
