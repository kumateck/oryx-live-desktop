import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "contractors",
  label: "Service providers",
  root: "/extrals/services-providers",
  order: 147,
  access: { kind: "all", permissions: ["CanViewContractors"] },
} satisfies ModuleManifest<"contractors", "/extrals/services-providers">;
