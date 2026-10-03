import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "swap-requests",
  label: "Swap requests",
  root: "/warehouse/swap-requests",
  order: 67,
  access: { kind: "some", permissions: ["CanIssueRawMaterialRequisitions", "CanIssuePackagingMaterialRequisitions"] },
} satisfies ModuleManifest<"swap-requests", "/warehouse/swap-requests">;
