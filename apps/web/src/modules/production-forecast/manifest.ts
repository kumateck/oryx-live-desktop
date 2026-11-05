import type { ModuleManifest } from "../contract";

export const manifest = { id: "production-forecast", label: "Production forecast", root: "/warehouse/production-forecast", order: 65,
  access: { kind: "all", permissions: ["CanViewProductionScheduleMaterialForecast"] },
} satisfies ModuleManifest<"production-forecast", "/warehouse/production-forecast">;
