import type { ModuleManifest } from "../contract";
import { collectionViewPermissions } from "./lib/collections";

export const manifest = {
  id: "collection-configurations",
  label: "Configuration collections",
  root: "/settings/config",
  order: 43,
  access: { kind: "some", permissions: collectionViewPermissions },
} satisfies ModuleManifest<"collection-configurations", "/settings/config">;
