// Structured STP content shared by the material and product STP modules, and read by the pending-approvals queue.
export { StpRevisionListPage } from "./stp-revision-list";
export { StpRevisionDetailPage } from "./stp-revision-detail";
export { StpRevisionEditorPage, type StpEditorMode } from "./stp-revision-editor";
export { StpImportPage } from "./stp-import-page";
export { StpRevisionApprovalEvidence } from "./stp-approval-evidence";
export { isStpKind, stpKindLabel, stpRevisionKeys, stpRevisionModelType, type StpKind, type StpRevisionKeys, type StpRevisionRoutes, type StpRoutesFor } from "./stp-keys";
