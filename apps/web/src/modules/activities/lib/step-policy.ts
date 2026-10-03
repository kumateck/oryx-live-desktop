import type { ActivityStep } from "../schemas/activity-schema";
import { stepAction, stepStatus } from "./step-status";

/**
 * Some instructions are carried out through a record of their own, and the server moves the step
 * when that record does: a stock requisition starts its step when raised and finishes it when the
 * stock is issued; the same goes for the batch record, the test request, final packing, and the
 * finished goods transfer. Such a step is not started or finished by hand, so the rules below are
 * read from the step's instructions, not from its position in the procedure.
 */
const startedByItsRecord = [stepAction.bmr, stepAction.stockRequisition, stepAction.finishedGoods, stepAction.atr] as const;
const completedByItsRecord = [stepAction.bmr, stepAction.stockRequisition, stepAction.finalPacking, stepAction.finishedGoods, stepAction.atr] as const;

export interface StepContext {
  step: ActivityStep;
  currentStepId: string | null;
  /** The batch was cancelled; nothing more can be done on it. */
  cancelled: boolean;
  userId: string | null;
  /** An extra material request for the batch is waiting for approval. */
  extraMaterialPending: boolean;
  /** An analytical test request exists for this step; its result, not a button, moves the step on. */
  atrExists: boolean;
}

/**
 * What can be done on a step right now, and why not when it cannot. Every change is something a
 * person chooses to do: nothing is started or finished because a page was opened. A critical step
 * is carried out by the people responsible for it, and the server refuses anyone else.
 */
export function stepPolicy({ step, currentStepId, cancelled, userId, extraMaterialPending, atrExists }: StepContext) {
  const has = (action: number) => step.team.some((member) => member.action === action);
  const active = step.id === currentStepId;
  const completed = step.status === stepStatus.completed;
  const open = active && !cancelled && !completed;
  const responsible = Boolean(userId && step.team.some((member) => member.id === userId));
  const allowed = !step.critical || responsible;
  const isNew = step.status === stepStatus.new;
  const running = step.status === stepStatus.inProgress;

  const blocked = cancelled ? "The batch was cancelled." : completed ? "This step is completed." : !active ? "This is not the batch's current step."
    : !allowed ? "This is a critical step. Only the people responsible for it can carry it out." : null;

  return {
    active, completed, open, responsible, allowed, blocked,
    // A test request begins its step. If the request was saved but the start was refused, the step can still be started by hand.
    canStart: open && allowed && isNew && !extraMaterialPending && (!startedByItsRecord.some(has) || (has(stepAction.atr) && atrExists)),
    canComplete: open && allowed && running && !completedByItsRecord.some(has) && !atrExists,
    /** The record that will finish this step, when it is not finished by hand. */
    waitsFor: completedByItsRecord.find(has) ?? null,
    has: {
      bmr: has(stepAction.bmr), stockRequisition: has(stepAction.stockRequisition), fullReturn: has(stepAction.fullReturn), extraMaterial: has(stepAction.extraMaterial),
      finalPacking: has(stepAction.finalPacking), finishedGoods: has(stepAction.finishedGoods), dispatch: has(stepAction.dispatch), atr: has(stepAction.atr),
    },
    canRequestStock: open && allowed && has(stepAction.stockRequisition) && (isNew || running),
    canFullReturn: open && allowed && has(stepAction.fullReturn) && running,
    canFinalPack: open && allowed && has(stepAction.finalPacking) && running,
    canRequestExtraMaterial: open && allowed && has(stepAction.extraMaterial) && running,
    canTransferFinishedGoods: open && allowed && has(stepAction.finishedGoods) && (isNew || running),
    canRequestAtr: open && allowed && has(stepAction.atr) && (isNew || running) && !atrExists,
  };
}
export type StepPolicy = ReturnType<typeof stepPolicy>;
