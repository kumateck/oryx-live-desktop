// The backend's keys for the approved vendor list (oryx-backend PermissionKeys, Quality Assurance → Approved Vendor List).
export const avlKeys = {
  view: "CanViewApprovedVendorList", create: "CanCreateApprovedVendorList", edit: "CanEditApprovedVendorList",
  revise: "CanReviseApprovedVendorList", editDraft: "CanEditApprovedVendorListDraft", submit: "CanSubmitApprovedVendorList", review: "CanReviewApprovedVendorList", return: "CanReturnApprovedVendorList",
  print: "CanPrintApprovedVendorList",
  delete: "CanDeleteApprovedVendorList",
} as const;
export const avlRoot = "/qa/approved-vendor-list";
export const avlAudit = { module: "Quality Assurance", subModule: "Approved Vendor List" } as const;
export const avlModelType = "ApprovedVendorList";
