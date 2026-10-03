import type { ModuleManifest } from "../contract";
export const manifest = { id: "working-hours-policy", label: "Working hours policy", root: "/settings/working-hours-policy", order: 93,
  access: { kind: "all", permissions: ["CanViewWorkingHoursPolicy"] },
} satisfies ModuleManifest<"working-hours-policy", "/settings/working-hours-policy">;
