import type { ModuleManifest } from "../contract";
// Reusable test questions, including table and governed formula questions, that form templates are built from.
export const manifest = { id: "questions", label: "Questions", root: "/settings/questions", order: 94,
  access: { kind: "all", permissions: ["CanViewQuestions"] },
  routes: [
    { pattern: "/settings/questions/table/create", access: { kind: "all", permissions: ["CanViewQuestions", "CanCreateQuestions"] } },
    { pattern: "/settings/questions/table/:id/edit", access: { kind: "all", permissions: ["CanViewQuestions", "CanEditQuestions"] } },
    { pattern: "/settings/questions/formula/create", access: { kind: "all", permissions: ["CanViewQuestions", "CanCreateQuestions"] } },
    { pattern: "/settings/questions/formula/:id/edit", access: { kind: "all", permissions: ["CanViewQuestions", "CanEditQuestions"] } },
  ],
} satisfies ModuleManifest<"questions", "/settings/questions">;
