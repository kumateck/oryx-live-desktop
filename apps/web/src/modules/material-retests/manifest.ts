import type { ModuleManifest } from "../contract";
export const manifest = { id: "material-retests", label: "Material retests", root: "/qc/material-retests", order: 75,
  access: { kind: "all", permissions: ["CanViewMaterialRetests"] },
  routes: [
    { pattern: "/qc/material-retests/:id/test-request", access: { kind: "all", permissions: ["CanViewMaterialRetestDetail", "CanLinkMaterialRetestTestRequest", "CanCreateUnscheduledQcTestRequest", "CanViewQcSpecifications"] } },
    { pattern: "/qc/material-retests/:id/testing", access: { kind: "all", permissions: ["CanViewMaterialRetestDetail", "CanViewQcTestRequests"] } },
    { pattern: "/qc/material-retests/:id/certificate", access: { kind: "all", permissions: ["CanViewMaterialRetestDetail", "CanViewQcCertificate"] } },
    { pattern: "/qc/material-retests/:id", access: { kind: "all", permissions: ["CanViewMaterialRetestDetail"] } }],
} satisfies ModuleManifest<"material-retests", "/qc/material-retests">;
