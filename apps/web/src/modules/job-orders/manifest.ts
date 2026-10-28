import type { ModuleManifest } from "../contract";
// Job orders sent to service providers. Its pages live in the job-requests module.
export const manifest = {
  id: "job-orders", label: "Job orders", root: "/extrals/job-orders", order: 157,
  access: { kind: "all", permissions: ["CanViewJobOrders"] },
} satisfies ModuleManifest<"job-orders", "/extrals/job-orders">;
