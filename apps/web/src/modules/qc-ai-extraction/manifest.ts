import type { ModuleManifest } from "../contract";
// Which provider the worksheet import's AI fallback extractor uses, and its key. A separate authority from using the import.
export const manifest = { id: "qc-ai-extraction", label: "AI extraction settings", root: "/settings/qc/ai-extraction", order: 96,
  access: { kind: "all", permissions: ["CanManageAiWorksheetExtractionSettings"] },
} satisfies ModuleManifest<"qc-ai-extraction", "/settings/qc/ai-extraction">;
