import type { ModuleManifest } from "../contract";

const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
// Routine quality control: water and environmental monitoring routines, their worksheets and certificates, the routine
// setup (schedules, routine ARDs, microbial applicability) and water quality coverage.
export const manifest = {
  id: "qc-routines", label: "Routine tests", root: "/qc/routines", order: 79,
  access: all("CanViewQcRoutineTests"),
  routes: [
    { pattern: "/qc/routines/setup", access: all("CanViewQcRoutineSetup") },
    { pattern: "/qc/routines/water-quality", access: all("CanViewQcRoutineWaterQuality") },
    { pattern: "/qc/routines/:id", access: all("CanViewQcRoutineTests") },
    { pattern: "/qc/routines/tracks/:id", access: all("CanViewQcRoutineTests") },
    { pattern: "/qc/routines/certificates/:id", access: { kind: "some", permissions: ["CanViewQcRoutineTests", "CanViewQcRoutineWaterQuality"] } },
  ],
} satisfies ModuleManifest<"qc-routines", "/qc/routines">;
