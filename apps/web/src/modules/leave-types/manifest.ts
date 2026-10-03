import type { ModuleManifest } from "../contract";
export const manifest = { id: "leave-types", label: "Leave type configuration", root: "/hr/leave-configuration", order: 121,
  access: { kind: "all", permissions: ["CanViewLeaveType"] },
} satisfies ModuleManifest<"leave-types", "/hr/leave-configuration">;
