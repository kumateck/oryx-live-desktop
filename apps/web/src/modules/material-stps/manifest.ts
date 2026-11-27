import type { ModuleManifest } from "../contract";
import { revisionKeys as r } from "./lib/material-stp-revisions";

// Raw and packaging are separate tasks with separate keys: a page that serves either kind needs either kind's key,
// and the kind of an existing record is checked again from what is stored.
const either = (raw: string, packaging: string) => ({ kind: "some" as const, permissions: [raw, packaging] });
const all = (...permissions: string[]) => ({ kind: "all" as const, permissions });
const byKind = (raw: readonly string[], packaging: readonly string[]) => ({ key: "type", choices: [
  { value: "0", access: all(...raw) }, { value: "1", access: all(...packaging) },
] });
// Raw and packaging material standard test procedures, their controlled Word documents and their structured revisions.
export const manifest = {
  id: "material-stps", label: "Material STPs", root: "/qc/material-stp", order: 75,
  access: either("CanViewRawMaterialStps", "CanViewPackagingMaterialStps"),
  query: { key: "type", choices: [
    { value: "0", access: { kind: "all", permissions: ["CanViewRawMaterialStps"] } },
    { value: "1", access: { kind: "all", permissions: ["CanViewPackagingMaterialStps"] } },
  ] },
  routes: [
    { pattern: "/qc/material-stp/:id", access: either("CanViewRawMaterialStps", "CanViewPackagingMaterialStps") },
    { pattern: "/qc/material-stp/:id/document", access: either("CanViewRawMaterialStps", "CanViewPackagingMaterialStps") },
    { pattern: "/qc/material-stp/revisions", access: either(r[0].view, r[1].view), query: byKind([r[0].view], [r[1].view]) },
    { pattern: "/qc/material-stp/revisions/new", access: either(r[0].create, r[1].create), query: byKind([r[0].view, r[0].create], [r[1].view, r[1].create]) },
    { pattern: "/qc/material-stp/revisions/import", access: either(r[0].import, r[1].import), query: byKind([r[0].view, r[0].import], [r[1].view, r[1].import]) },
    { pattern: "/qc/material-stp/revisions/:id", access: either(r[0].view, r[1].view) },
    { pattern: "/qc/material-stp/revisions/:id/draft", access: either(r[0].editDraft, r[1].editDraft) },
    { pattern: "/qc/material-stp/revisions/:id/edit", access: either(r[0].edit, r[1].edit) },
  ],
} satisfies ModuleManifest<"material-stps", "/qc/material-stp">;
