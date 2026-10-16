export const issueBmrPath = "/qa/issue-bmr";
export const issueBmrDetailPath = (id: string) => `${issueBmrPath}/${id}`;
export const issueBmrAudit = { module: "Quality Assurance", subModule: "Issue BMR" } as const;
export const issueBmrPermissions = { view: "CanViewIssuedBmrBprs", issue: "CanIssueBmr" } as const;
