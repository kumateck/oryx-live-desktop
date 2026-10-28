import type { ModuleManifest } from "../contract";

const qa = { kind: "some" as const, permissions: ["CanViewAnalyticalTestRequests", "CanViewAnalyticalTestRequestsForSampling"] };
const qc = { kind: "some" as const, permissions: ["CanViewProductAnalyticalTestRequests", "CanViewProductAnalyticalTestRequestsForAnalysing"] };
// Requests to test a product batch at a production stage. QA takes the sample (?type=0); QC receives it, assigns and runs the test and checks the results.
export const manifest = {
  id: "analytical-test-requests", label: "Analytical test requests", root: "/atr", order: 73,
  access: { kind: "some", permissions: [...qa.permissions, ...qc.permissions] },
  query: { key: "type", choices: [{ value: "0", access: qa }, ...["1", "2", "6", "3", "4", "5"].map((value) => ({ value, access: qc }))] },
  routes: [
    { pattern: "/atr/:id", access: { kind: "all", permissions: ["CanCheckProductTest"] } },
    { pattern: "/atr/:id/assign", access: { kind: "all", permissions: ["CanAssignProductTest"] } },
    { pattern: "/atr/:id/reassign", access: { kind: "all", permissions: ["CanReassignProductTest"] } },
    { pattern: "/atr/:id/test", access: { kind: "all", permissions: ["CanStartProductTest"] } },
  ],
} satisfies ModuleManifest<"analytical-test-requests", "/atr">;
