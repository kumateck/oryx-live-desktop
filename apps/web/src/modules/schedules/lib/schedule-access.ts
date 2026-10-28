export const schedulesPath = "/production/schedules";
export const scheduleCreatePath = `${schedulesPath}/create`;
export const monthlyReportPath = `${schedulesPath}/monthly-report`;
export const scheduleDetailPath = (id: string) => `${schedulesPath}/${id}/details`;
export const scheduleAddProductsPath = (id: string) => `${schedulesPath}/${id}/products/add`;
export const scheduleRemoveProductsPath = (id: string) => `${schedulesPath}/${id}/products/remove`;
export const scheduleEditPath = (id: string) => `${schedulesPath}/${id}/edit`;

export const schedulePermissions = {
  view: "CanViewProductSchedules",
  create: "CanCreateProductSchedule",
  edit: "CanEditProductSchedule",
  addProducts: "CanAddProductsToProductSchedule",
  removeProducts: "CanRemoveProductsFromProductSchedule",
} as const;

export const audit = { module: "Production", subModule: "Product Schedule" } as const;
/** The record type whose code rule numbers new schedules. */
export const scheduleCodeModel = "ProductionSchedule";
