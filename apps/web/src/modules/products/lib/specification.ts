import type {
  DomainEntitiesProductSpecificationsCreateProductSpecificationRequest as CreateRequest,
  DomainEntitiesProductSpecificationsUpdateProductSpecificationRequest as UpdateRequest,
} from "@/shared/api/generated/analytical";
import type { SavedSpecification, SpecificationFormValues } from "../schemas/specification-schema";
import type { ArdStage } from "./ard";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** The earliest revision date: the day after the effective date, and never today or earlier. */
export function earliestRevisionDate(effectiveDate: Date | null | undefined, now = new Date()): Date {
  const today = startOfDay(now);
  const effective = effectiveDate && !Number.isNaN(effectiveDate.getTime()) ? startOfDay(effectiveDate) : today;
  const base = effective > today ? effective : today;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
}

export const specificationNumbering = "ProductSpecNumber";
const stageCodes: Record<ArdStage, string> = { 0: "IPC", 1: "B", 2: "FP" };
/** The number series for a product's division and a test stage, or null when the product has no division set. */
export function specificationPrefix(division: number | null | undefined, stage: ArdStage): string | null {
  const department = division === 0 ? "BMP" : division === 1 ? "NMP" : null;
  return department ? `${department}/${stageCodes[stage]}/SPC` : null;
}
export function nextSpecificationNumber(prefix: string, existingCount: number): string {
  return `${prefix}/${String(Math.max(0, Math.trunc(existingCount) || 0) + 1).padStart(3, "0")}`;
}

function shared(values: SpecificationFormValues) {
  return {
    specificationNumber: values.specificationNumber, revisionNumber: values.revisionNumber, supersedesNumber: values.supersedesNumber,
    effectiveDate: values.effectiveDate.toISOString(), reviewDate: values.reviewDate.toISOString(), formId: values.form.value, description: values.description ?? "",
  };
}

export function newSpecificationRequest(values: SpecificationFormValues, context: { productId: string; stage: ArdStage; userId: string; now?: Date }): CreateRequest {
  const due = new Date(context.now ?? new Date());
  due.setDate(due.getDate() + 1);
  return { ...shared(values), testStage: context.stage, productIds: [context.productId], userId: context.userId, dueDate: due.toISOString() };
}

/** The update keeps the saved due date and reference, which this page does not edit. */
export function updatedSpecificationRequest(values: SpecificationFormValues, saved: SavedSpecification): UpdateRequest {
  return { ...shared(values), testStage: saved.testStage as ArdStage, ...(saved.dueDate ? { dueDate: saved.dueDate } : {}), ...(saved.reference ? { reference: saved.reference } : {}) };
}
