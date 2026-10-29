import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const person = z.object({ id: z.string().nullish(), firstName: z.string().nullish(), lastName: z.string().nullish(), avatar: z.string().nullish() }).nullish()
  .transform((value) => value ? { id: value.id ?? null, name: `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || "Unnamed user", avatar: value.avatar ?? null } : null);

const stepSchema = z.object({
  id: z.string().min(1), order: z.number().nullish(), status: z.number().nullish(), isCritical: z.boolean().nullish(),
  startedAt: z.string().nullish(), completedAt: z.string().nullish(),
  operation: z.object({ name: text, description: text }).nullish(),
  workCenters: z.array(z.object({ workCenter: z.object({ name: text }).nullish() })).nullish(),
  responsibleUsers: z.array(z.object({ user: person, action: z.number().nullish(), productAnalyticalRawData: z.object({ id: z.string().nullish(), stage: z.number().nullish() }).nullish() })).nullish(),
}).transform((step) => ({
  id: step.id, order: step.order ?? 0, status: step.status ?? 0, critical: step.isCritical ?? false,
  startedAt: step.startedAt ?? null, completedAt: step.completedAt ?? null,
  name: step.operation?.name ?? "Unnamed step", description: step.operation?.description ?? null,
  workCenters: (step.workCenters ?? []).flatMap((item) => item.workCenter?.name ? [item.workCenter.name] : []),
  team: (step.responsibleUsers ?? []).flatMap((item) => item.user ? [{ ...item.user, action: item.action ?? null, ardId: item.productAnalyticalRawData?.id ?? null, ardStage: item.productAnalyticalRawData?.stage ?? null }] : []),
}));
export type ActivityStep = z.infer<typeof stepSchema>;
export const activityStepSchema = stepSchema;

const batch = z.object({
  id: z.string().nullish(), batchNumber: text, quantity: z.number().nullish(), batchSize: z.number().nullish(),
  cancelled: z.boolean().nullish(), reasonForCancellation: text,
  product: z.object({ id: z.string().nullish(), name: text, code: text, baseUoM: z.object({ symbol: text }).nullish() }).nullish(),
  productionSchedule: z.object({ id: z.string().nullish(), code: text }).nullish(),
  productPacking: z.object({ name: text }).nullish(), marketType: z.object({ name: text }).nullish(),
}).nullish().transform((value) => ({
  id: value?.id ?? null, batchNumber: value?.batchNumber ?? null, quantity: value?.quantity ?? 0, half: value?.batchSize === 1,
  cancelled: value?.cancelled ?? false, cancellationReason: value?.reasonForCancellation ?? null,
  productId: value?.product?.id ?? null, productName: value?.product?.name ?? "Unnamed product", productCode: value?.product?.code ?? null, unit: value?.product?.baseUoM?.symbol ?? null,
  scheduleId: value?.productionSchedule?.id ?? null, scheduleCode: value?.productionSchedule?.code ?? null,
  packing: value?.productPacking?.name ?? null, market: value?.marketType?.name ?? null,
}));
export type ActivityBatch = z.infer<typeof batch>;

/** One batch's production run: its steps in order, the step it is on, and what has happened so far. */
export const activitySchema = z.object({
  id: z.string().min(1), status: z.number().nullish(), startedAt: z.string().nullish(), completedAt: z.string().nullish(),
  currentStep: z.object({ id: z.string().nullish() }).nullish(),
  steps: z.array(stepSchema).nullish(),
  activityLogs: z.array(z.object({ id: z.string().nullish(), message: text, timestamp: z.string().nullish(), user: person })).nullish(),
  productionScheduleProduct: batch,
}).transform((activity) => ({
  id: activity.id, status: activity.status ?? 0, startedAt: activity.startedAt ?? null, completedAt: activity.completedAt ?? null,
  currentStepId: activity.currentStep?.id ?? null,
  steps: [...(activity.steps ?? [])].sort((a, b) => a.order - b.order),
  // Newest first: what just happened is what the reader came for.
  logs: (activity.activityLogs ?? []).map((log, index) => ({ id: log.id ?? `log-${index}`, message: log.message ?? "", at: log.timestamp ?? null, user: log.user }))
    .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")),
  batch: activity.productionScheduleProduct,
}));
export type Activity = z.infer<typeof activitySchema>;

/** The department's running batches, grouped by the operation each is at. */
export const activityBoardSchema = z.array(z.object({
  operation: z.object({ id: z.string().nullish(), name: text }).nullish(),
  activities: z.array(z.object({
    id: z.string().nullish(), batchNumber: text, quantity: z.number().nullish(), createdAt: z.string().nullish(), startedAt: z.string().nullish(),
    productionScheduleProduct: batch,
    currentStep: z.object({ status: z.number().nullish(), isCritical: z.boolean().nullish(), startedAt: z.string().nullish(), productionActivity: z.object({ id: z.string().nullish() }).nullish(),
      responsibleUsers: z.array(z.object({ user: person })).nullish() }).nullish(),
  })).nullish(),
}).transform((group, context) => ({
  id: group.operation?.id ?? `operation-${context.issues.length}-${group.operation?.name ?? ""}`, name: group.operation?.name ?? "Unnamed operation",
  cards: (group.activities ?? []).flatMap((item) => {
    const activityId = item.currentStep?.productionActivity?.id ?? item.id;
    return activityId ? [{
      activityId, batchNumber: item.batchNumber ?? item.productionScheduleProduct.batchNumber, quantity: item.quantity ?? item.productionScheduleProduct.quantity,
      unit: item.productionScheduleProduct.unit, productName: item.productionScheduleProduct.productName, productCode: item.productionScheduleProduct.productCode,
      scheduleCode: item.productionScheduleProduct.scheduleCode, startedAt: item.startedAt ?? item.createdAt ?? null,
      stepStatus: item.currentStep?.status ?? 0, stepStartedAt: item.currentStep?.startedAt ?? null, critical: item.currentStep?.isCritical ?? false,
      team: (item.currentStep?.responsibleUsers ?? []).flatMap((entry) => entry.user ? [entry.user] : []),
    }] : [];
  }),
}))).nullish().transform((value) => value ?? []);
export type BoardColumn = z.infer<typeof activityBoardSchema>[number];
export type BoardCard = BoardColumn["cards"][number];

const status = z.object({ status: z.number().nullish(), code: text }).nullish();
const requisitionState = z.object({ status: z.number().nullish(), code: text, productionActivityStepId: z.string().nullish() }).nullish();
export const requisitionStateSchema = requisitionState.transform((value) => value ? { status: value.status ?? 0, code: value.code, stepId: value.productionActivityStepId ?? null } : null);
export const bmrStateSchema = z.object({ id: z.string().nullish(), status: z.number().nullish(), batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish() }).nullish()
  .transform((value) => value ? { id: value.id ?? null, status: value.status ?? 0, batchNumber: value.batchNumber, manufacturingDate: value.manufacturingDate ?? null, expiryDate: value.expiryDate ?? null } : null);
export type BatchRecord = NonNullable<z.infer<typeof bmrStateSchema>>;
export const extraMaterialsSchema = z.array(z.object({ status: z.number().nullish() })).nullish().transform((value) => (value ?? []).map((item) => item.status ?? 0));
export const atrStateSchema = z.object({ id: z.string().nullish(), status: z.number().nullish() }).nullish().transform((value) => value?.id ? { id: value.id, status: value.status ?? null } : null);

/** Extra material already asked for on a batch. */
export const extraMaterialRequestsSchema = z.array(z.object({
  id: z.string().nullish(), status: z.number().nullish(), quantity: z.number().nullish(), createdAt: z.string().nullish(),
  material: z.object({ name: text, code: text }).nullish(), uoM: z.object({ symbol: text }).nullish(),
}).transform((item, context) => ({
  id: item.id ?? `request-${context.issues.length}`, status: item.status ?? 0, quantity: item.quantity ?? 0, createdAt: item.createdAt ?? null,
  name: item.material?.name ?? "Unnamed material", code: item.material?.code ?? null, unit: item.uoM?.symbol ?? null,
}))).nullish().transform((value) => (value ?? []).map((item, index) => ({ ...item, id: `${item.id}-${index}` })));
export type ExtraMaterialRequestRow = z.infer<typeof extraMaterialRequestsSchema>[number];
