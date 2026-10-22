import type { ModuleManifest } from "../contract";
import { transferPermissions } from "./lib/access";
export const manifest = {
  id: "production-transfers", label: "Production stock transfers", root: "/production/stock-transfer-requests", order: 44,
  access: { kind: "some", permissions: [transferPermissions.incoming, transferPermissions.outgoing] },
  query: { key: "type", choices: [
    { value: "0", access: { kind: "all", permissions: [transferPermissions.incoming] } },
    { value: "1", access: { kind: "all", permissions: [transferPermissions.outgoing] } },
  ] },
} satisfies ModuleManifest<"production-transfers", "/production/stock-transfer-requests">;
