import type { ModuleManifest } from "../contract";
export const manifest = { id: "qc-rework", label: "QC rework", root: "/qc/rework-tasks", order: 76,
  access: { kind: "all", permissions: ["CanViewResponseReworkTasks"] },
  routes: [
    { pattern: "/qc/rework-tasks/:id", access: { kind: "all", permissions: ["CanViewResponseReworkTaskDetail"] } },
    { pattern: "/qc/rework-tasks/:id/test", access: { kind: "all", permissions: ["CanViewResponseReworkTaskDetail"] } },
  ],
} satisfies ModuleManifest<"qc-rework", "/qc/rework-tasks">;
