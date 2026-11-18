import type { ModuleManifest } from "../contract";

const detail = "CanViewMaterialRetestDetail";
// A retest tests a raw or a packaging batch; each test page is open to the key for either kind, and the shared material
// test pages check the batch's own kind before any action (as on a goods receipt note).
const either = (raw: string, packaging: string) => ({ kind: "some" as const, permissions: [raw, packaging] });
const test = either("CanStartRawMaterialTest", "CanStartPackagingMaterialTest");

// Material retests of expired batches, run like analytical test requests: the warehouse requests, QA samples, QC
// acknowledges, assigns, tests and checks, and the result's approval releases the batch.
export const manifest = { id: "material-retests", label: "Material retests", root: "/qc/material-retests", order: 75,
  access: { kind: "all", permissions: ["CanViewMaterialRetests"] },
  routes: [
    { pattern: "/qc/material-retests/:id/assign", access: test },
    { pattern: "/qc/material-retests/:id/test", access: test },
    { pattern: "/qc/material-retests/:id/reassign", access: either("CanReassignRawMaterialTest", "CanReassignPackagingMaterialTest") },
    { pattern: "/qc/material-retests/:id/progress", access: { kind: "some", permissions: ["CanStartRawMaterialTest", "CanStartPackagingMaterialTest", "CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult"] } },
    { pattern: "/qc/material-retests/:id/results", access: either("CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult") },
    { pattern: "/qc/material-retests/:id", access: { kind: "all", permissions: [detail] } }],
} satisfies ModuleManifest<"material-retests", "/qc/material-retests">;
