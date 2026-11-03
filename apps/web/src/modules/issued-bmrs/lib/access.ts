export const issuedBmrPath = "/qa/issued-bmrs";
export const issuedBmrAudit = { module: "Quality Assurance", subModule: "Issued BMR Records" } as const;
export const issuedBmrPermissions = {
  view: "CanViewIssuedBmrRecords", correct: "CanCorrectIssuedBmrBatchNumber",
  revise: "CanRequestIssuedBmrRevision", approve: "CanApproveIssuedBmrRevision",
} as const;
export const issuedBmrAction = (permission: string) => ({ kind: "all", permissions: [issuedBmrPermissions.view, permission] } as const);
