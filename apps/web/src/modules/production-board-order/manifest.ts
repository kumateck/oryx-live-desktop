import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "production-board-order", label: "Production board order", root: "/settings/production-board-order", order: 44,
  access: { kind: "all", permissions: ["CanViewDepartmentProductionBoardOrder"] },
} satisfies ModuleManifest<"production-board-order", "/settings/production-board-order">;
