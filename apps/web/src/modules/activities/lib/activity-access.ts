export const activitiesPath = "/production/activities";
export const batchBoardPath = (activityId: string) => `${activitiesPath}/${activityId}/board`;
export const extraMaterialPath = (activityId: string) => `${activitiesPath}/${activityId}/extra-material`;
export const finalPackingPath = (activityId: string) => `${activitiesPath}/${activityId}/final-packing`;
export const stepPath = (activityId: string, stepId: string) => `${batchBoardPath(activityId)}/${stepId}`;

/** Each batch-board task has its own key; the server checks the same keys. All are production-department tasks. */
export const batchTaskPermissions = {
  step: "CanUpdateProductionStep",
  returns: "CanReturnProductionMaterials",
  finalPacking: "CanRecordFinalPacking",
  finishedGoods: "CanCreateFgtn",
  extraMaterial: "CanRequestExtraPacking",
} as const;
export const batchTask = (permission: string) => ({ kind: "all", permissions: [permission], departmentType: 0 } as const);

export const activityAudit = { module: "Production", subModule: "Activities" } as const;
export const stepAudit = { module: "Production", subModule: "Steps" } as const;

/** How often an open board asks the server what changed. Another user finishing a step shows up within this time. */
export const boardRefreshMs = 30_000;
