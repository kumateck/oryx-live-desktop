import type { ModuleManifest } from "../contract";
export const manifest = { id: "alerts", label: "Alerts", root: "/settings/alert", order: 80,
  access: { kind: "all", permissions: ["CanViewAlerts"] },
} satisfies ModuleManifest<"alerts", "/settings/alert">;
