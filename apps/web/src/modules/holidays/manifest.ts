import type { ModuleManifest } from "../contract";
export const manifest = { id: "holidays", label: "Holidays", root: "/settings/holidays", order: 86,
  access: { kind: "all", permissions: ["CanViewHolidays"] },
} satisfies ModuleManifest<"holidays", "/settings/holidays">;
