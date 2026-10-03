import type { DomainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest as AtrRequest } from "@/shared/api/generated/analytical";
import type { ActivityStep, BatchRecord } from "../schemas/activity-schema";
import { stepAction } from "./step-status";

export type TestStage = 0 | 1 | 2;
const isStage = (value: number | null): value is TestStage => value === 0 || value === 1 || value === 2;

/** The stage a step's test request is for: the stage of the analytical raw data set on its ATR instruction in the product's procedure. */
export function configuredTestStage(step: Pick<ActivityStep, "team">): TestStage | null {
  const stage = step.team.find((member) => member.action === stepAction.atr && isStage(member.ardStage))?.ardStage ?? null;
  return isStage(stage) ? stage : null;
}

/** Why a test request cannot be raised yet, or null when it can. */
export function atrProblem(stage: TestStage | null, record: BatchRecord | null): string | null {
  if (stage === null) return "This step's ATR instruction has no analytical raw data. Set it on the product's procedure first.";
  if (!record?.id) return "The batch has no batch manufacturing record yet, so there is nothing to test against.";
  return null;
}

export function atrRequest(input: { stage: TestStage; record: BatchRecord & { id: string }; batchId: string; stepId: string; stateId: string; filled: string }): AtrRequest {
  return {
    stage: input.stage, stateId: input.stateId, filled: input.filled,
    productionScheduleProductId: input.batchId, productionActivityStepId: input.stepId, batchManufacturingRecordId: input.record.id,
    ...(input.record.manufacturingDate ? { manufacturingDate: input.record.manufacturingDate } : {}),
    ...(input.record.expiryDate ? { expiryDate: input.record.expiryDate } : {}),
  };
}
