import type { ModuleManifest } from "../contract";
import { avlKeys as k } from "./lib/keys";
// QA's approved manufacturer list for raw materials (QAD/SOP/007/A03-06). Its current revision restricts procurement.
export const manifest = {
  id: "approved-vendor-list", label: "Approved vendor list", root: "/qa/approved-vendor-list", order: 72,
  access: { kind: "all", permissions: [k.view] },
  routes: [
    { pattern: "/qa/approved-vendor-list/new", access: { kind: "all", permissions: [k.view, k.create] } },
    { pattern: "/qa/approved-vendor-list/revise", access: { kind: "all", permissions: [k.view, k.revise] } },
    { pattern: "/qa/approved-vendor-list/:id/edit", access: { kind: "all", permissions: [k.view, k.edit] } },
  ],
} satisfies ModuleManifest<"approved-vendor-list", "/qa/approved-vendor-list">;
