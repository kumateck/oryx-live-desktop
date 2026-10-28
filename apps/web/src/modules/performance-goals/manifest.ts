import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "performance-goals",
  label: "Goals",
  root: "/hr/goals",
  order: 139,
  access: { kind: "some", permissions: ["CanViewOwnGoals", "CanViewTeamGoals"] },
  // A review the signed-in employee takes part in, as the employee or the assigned reviewer.
  routes: [{ pattern: "/hr/goals/reviews/:id", access: { kind: "some", permissions: ["CanSubmitSelfAssessment", "CanSubmitManagerReview"] } }],
} satisfies ModuleManifest<"performance-goals", "/hr/goals">;
