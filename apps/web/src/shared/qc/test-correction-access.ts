export const testCorrectionAccess = {
  product: { return: "CanReturnProductTestForCorrection", history: "CanViewProductTestCorrectionHistory" },
  raw: { return: "CanReturnRawMaterialTestForCorrection", history: "CanViewRawMaterialTestCorrectionHistory" },
  packaging: { return: "CanReturnPackagingMaterialTestForCorrection", history: "CanViewPackagingMaterialTestCorrectionHistory" },
} as const;
export type TestCorrectionKind = keyof typeof testCorrectionAccess;
