import type { ModuleManifest } from "../contract";
export const manifest = { id: "signature-settings", label: "Signature settings", root: "/settings/signature", order: 83,
  access: { kind: "all", permissions: ["CanViewSignatureSettings"] },
} satisfies ModuleManifest<"signature-settings", "/settings/signature">;
