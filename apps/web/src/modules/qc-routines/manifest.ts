import type { ModuleManifest } from "../contract";

const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
// Routine quality control: water and environmental monitoring routines, their worksheets and certificates, the routine
// setup (schedules, routine ARDs, microbial applicability) and water quality coverage.
export const manifest = {
  id: "qc-routines", label: "Routine tests", root: "/qc/routines", order: 79,
  access: all("CanViewRoutineTests"),
  routes: [
    { pattern: "/qc/routines/setup", access: all("CanViewRoutineSetup") },
    { pattern: "/qc/routines/water-quality", access: all("CanViewWaterQuality") },
    { pattern: "/qc/routines/:id", access: all("CanViewRoutineTests") },
    { pattern: "/qc/routines/tracks/:id", access: all("CanViewRoutineTests") },
    { pattern: "/qc/routines/certificates/:id", access: { kind: "some", permissions: ["CanViewRoutineTests", "CanViewWaterQuality"] } },
  ],
} satisfies ModuleManifest<"qc-routines", "/qc/routines">;
