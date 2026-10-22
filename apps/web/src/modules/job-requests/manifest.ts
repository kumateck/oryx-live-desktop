import type { ModuleManifest } from "../contract";
// Job requests for in-house or external work, from approval to completion. Job orders sent to providers are the job-orders module.
export const manifest = {
  id: "job-requests", label: "Job requests", root: "/extrals/job-requests", order: 156,
  access: { kind: "all", permissions: ["CanViewJobRequests"] },
} satisfies ModuleManifest<"job-requests", "/extrals/job-requests">;
