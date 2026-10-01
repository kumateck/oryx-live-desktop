import type { DomainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest as ArdRequest } from "@/shared/api/generated/analytical";
import type { ArdFormValues, ArdSpecificationSource, SavedArd } from "../schemas/ard-schema";

/** Test stages in the order they are offered. The numbers are the backend's. */
export const ardStages = [{ value: 1, label: "Bulk" }, { value: 2, label: "Finished" }, { value: 0, label: "Intermediate" }] as const;
export type ArdStage = (typeof ardStages)[number]["value"];
export function ardStageLabel(stage: number): string { return ardStages.find((item) => item.value === stage)?.label ?? "Unknown stage"; }

/** What a new ARD for a stage is created from: the product's STP and that stage's specification with its template form. */
export interface ArdSource { stage: ArdStage; stp: { id: string; stpNumber: string }; form: { id: string; name: string }; specNumber: string }

/** For each stage without an ARD: what it would be created from, or why it cannot be created yet. */
export function ardStageChoices(ards: readonly SavedArd[], stp: { id: string; stpNumber: string } | null, specifications: ArdSpecificationSource) {
  const used = new Set(ards.map((ard) => ard.stage));
  return ardStages.filter((stage) => !used.has(stage.value)).map((stage) => {
    const specification = specifications.find((item) => item.testStage === stage.value);
    const missing = [
      stp ? "" : "the product's STP",
      !specification ? `${/^[aeiou]/i.test(stage.label) ? "an" : "a"} ${stage.label.toLowerCase()} specification` : !specification.form?.id ? `a template form on the ${stage.label.toLowerCase()} specification` : "",
    ].filter(Boolean);
    const source: ArdSource | null = stp && specification?.form?.id
      ? { stage: stage.value, stp, form: { id: specification.form.id, name: specification.form.name }, specNumber: specification.specificationNumber } : null;
    return { ...stage, source, missing: missing.join(" and ") };
  });
}

export function newArdRequest(values: ArdFormValues, source: ArdSource): ArdRequest {
  return { specNumber: values.specNumber, description: values.description ?? "", stage: source.stage, stpId: source.stp.id, formId: source.form.id };
}

/**
 * The request that updates a saved ARD, or null when it lost its STP or form and cannot be saved.
 * The backend overwrites every field, and refuses a different analysis type, so what this page
 * does not edit is sent back as it was.
 */
export function updatedArdRequest(values: ArdFormValues, saved: SavedArd): ArdRequest | null {
  const stpId = saved.productStandardTestProcedure?.id;
  const formId = saved.form?.id;
  if (!stpId || !formId) return null;
  return {
    specNumber: values.specNumber, description: values.description ?? "", stage: saved.stage as ArdStage, stpId, formId,
    ...(saved.analysisType === 0 || saved.analysisType === 1 ? { analysisType: saved.analysisType } : {}),
    ...(saved.coaItems ? { coaItems: saved.coaItems } : {}),
  };
}
