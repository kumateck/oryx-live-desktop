export const formulaRepairPermissions = { question: "CanRepairQuestionFormula", test: "CanRepairTestFormula" } as const;
export const anyFormulaRepairPermission = { kind: "all", permissions: ["CanViewQuestions"], anyPermissions: Object.values(formulaRepairPermissions) } as const;
export const formulaRepairPath = (questionId: string, atrId?: string, fieldId?: string) =>
  `/settings/questions/formula/${questionId}/repair${atrId && fieldId ? `?atr=${encodeURIComponent(atrId)}&field=${encodeURIComponent(fieldId)}` : ""}`;
