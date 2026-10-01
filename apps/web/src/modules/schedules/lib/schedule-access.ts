export const schedulesPath = "/production/schedules";
export const scheduleCreatePath = `${schedulesPath}/create`;
export const scheduleEditPath = (id: string) => `${schedulesPath}/${id}/edit`;

export const schedulePermissions = {
  view: "CanViewProductSchedules",
  create: "CanCreateProductSchedule",
  edit: "CanEditProductSchedule",
} as const;

export const audit = { module: "Production", subModule: "Product Schedule" } as const;
/** The record type whose code rule numbers new schedules. */
export const scheduleCodeModel = "ProductionSchedule";
