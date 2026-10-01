import type { DomainEntitiesRoutesCreateRouteRequest, DomainEntitiesRoutesOperationAction } from "@/shared/api/generated/products";
import type { ProcedureStepFormValues, SavedRoutes } from "../schemas/procedure-schema";
import { actionLabel, ardLabel, atrAction } from "./procedure-actions";

interface Option { value: string; label: string }

export interface ProcedureParty {
  kind: "user" | "role";
  who: Option;
  action: Option;
  /** Analytical raw data, for an ATR instruction only. */
  ard: Option | null;
}

/** One step of a product's manufacturing procedure. `key` identifies the row on the page. */
export interface ProcedureStep {
  key: string;
  operation: Option;
  workCenters: Option[];
  estimatedTime: string;
  /** A critical step is completed by a person; any other step is automated. */
  isCritical: boolean;
  parties: ProcedureParty[];
}

type SavedParty = SavedRoutes[number]["responsibleUsers"][number];
function party(kind: "user" | "role", saved: SavedParty): ProcedureParty[] {
  const who = kind === "user" ? saved.user : saved.role;
  if (!who?.id || typeof saved.action !== "number") return [];
  const ard = saved.productAnalyticalRawData;
  return [{ kind, who: { value: who.id, label: who.name || "Unnamed" }, action: { value: String(saved.action), label: actionLabel(saved.action) },
    ard: ard?.id ? { value: ard.id, label: ardLabel(ard.productStandardTestProcedure?.stpNumber, ard.stage) } : null }];
}

/** Saved steps in their saved order; steps without an operation cannot be edited or saved and are left out. */
export function fromSavedRoutes(saved: SavedRoutes): ProcedureStep[] {
  return [...saved].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).flatMap((route, index) => route.operation?.id ? [{
    key: route.id ?? `saved-${index}`,
    operation: { value: route.operation.id, label: route.operation.name || "Unnamed operation" },
    workCenters: route.workCenters.flatMap(({ workCenter }) => workCenter?.id ? [{ value: workCenter.id, label: workCenter.name || "Unnamed" }] : []),
    estimatedTime: route.estimatedTime, isCritical: route.isCritical,
    parties: [...route.responsibleUsers.flatMap((item) => party("user", item)), ...route.responsibleRoles.flatMap((item) => party("role", item))],
  }] : []);
}

export function stepFromForm(values: ProcedureStepFormValues, key: string): ProcedureStep {
  return {
    key, operation: values.operation, workCenters: [...values.workCenters], estimatedTime: values.estimatedTime?.trim() ?? "", isCritical: values.isCritical ?? false,
    parties: values.parties.flatMap((item) => item.who && item.action ? [{ kind: item.kind, who: item.who, action: item.action,
      // Analytical raw data belongs to the ATR instruction; a value left from an earlier choice is dropped.
      ard: item.action.value === atrAction ? item.ard ?? null : null }] : []),
  };
}

export function hasOperation(steps: readonly ProcedureStep[], operationId: string, exceptKey: string | null): boolean {
  return steps.some((step) => step.key !== exceptKey && step.operation.value === operationId);
}

const actionNumber = (value: string) => Number(value) as DomainEntitiesRoutesOperationAction;

/**
 * The request that replaces a product's procedure. Steps are numbered by position.
 * `keepArd` is false when copying to another product: analytical raw data belongs to the product it was created for.
 */
export function toRoutesRequest(steps: readonly ProcedureStep[], keepArd = true): DomainEntitiesRoutesCreateRouteRequest[] {
  const parties = (step: ProcedureStep, kind: "user" | "role") => step.parties.filter((item) => item.kind === kind)
    .map((item) => ({ action: actionNumber(item.action.value), productAnalyticalRawDataId: keepArd ? item.ard?.value ?? null : null, id: item.who.value }));
  return steps.map((step, index) => ({
    operationId: step.operation.value, order: index + 1, isCritical: step.isCritical, estimatedTime: step.estimatedTime || null,
    workCenters: step.workCenters.map((center) => ({ workCenterId: center.value })),
    responsibleUsers: parties(step, "user").map(({ id, ...rest }) => ({ userId: id, ...rest })),
    responsibleRoles: parties(step, "role").map(({ id, ...rest }) => ({ roleId: id, ...rest })),
  }));
}
