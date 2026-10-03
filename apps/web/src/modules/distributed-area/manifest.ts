import type { ModuleManifest } from "../contract";
import { permissionTabs } from "../../shared/auth/permission-tabs";
import { viewDistributedPermissions } from "./lib/distributed-access";

export const manifest = {
  query: permissionTabs(viewDistributedPermissions),
  id: "distributed-area",
  label: "Distributed area",
  root: "/warehouse/distributed-area",
  order: 59,
  access: { kind: "some", permissions: ["CanViewDistributedRawMaterials", "CanViewDistributedPackagingMaterials"] },
} satisfies ModuleManifest<"distributed-area", "/warehouse/distributed-area">;
