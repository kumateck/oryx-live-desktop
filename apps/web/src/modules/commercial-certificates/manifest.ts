import type { ModuleManifest } from "../contract";

// A commercial certificate of analysis: the fixed copy of a material or product's approved chemical and microbial results.
// The server checks no permission; anyone who may view certificates or check test results may open one.
export const manifest = {
  id: "commercial-certificates", label: "Commercial certificates", root: "/qc/commercial-certificates", order: 80,
  access: { kind: "some", permissions: ["CanViewQcCertificate", "CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult", "CanCheckProductTest"] },
  routes: [{ pattern: "/qc/commercial-certificates/:id", access: { kind: "some", permissions: ["CanViewQcCertificate", "CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult", "CanCheckProductTest"] } }],
} satisfies ModuleManifest<"commercial-certificates", "/qc/commercial-certificates">;
