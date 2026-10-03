import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "extra-material-issue",
  label: "Extra material requisitions",
  root: "/warehouse/extra-material",
  order: 61,
  access: { kind: "some", permissions: ["CanIssueRawMaterialRequisitions", "CanIssuePackagingMaterialRequisitions"] },
} satisfies ModuleManifest<"extra-material-issue", "/warehouse/extra-material">;
