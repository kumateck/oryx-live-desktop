import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "finished-goods-notes",
  label: "Finished goods transfer notes",
  root: "/warehouse/finished-goods-transfer-notes",
  order: 93,
  access: { kind: "all", permissions: ["CanViewFgtn"] },
} satisfies ModuleManifest<"finished-goods-notes", "/warehouse/finished-goods-transfer-notes">;
