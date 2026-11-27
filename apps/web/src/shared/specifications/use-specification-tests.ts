import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { specificationValuesApi } from "./specification-api";
import { asAnalysis, sectionPageSchema, templateSectionsSchema, withSavedValues, type Specification } from "./specification-schema";

const audit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;

/**
 * A specification's tests: the chemical template's sections, then the microbial template's, each with the reference value saved for it.
 * Material and product values are looked up by their own specification number parameter.
 */
export function useSpecificationTests(specification: Specification | null, by: "materialSpecificationNumber" | "productSpecificationNumber") {
  const number = specification?.specificationNumber ?? null;
  const formId = specification?.form?.id ?? null;
  const microbialFormId = specification?.microbialForm?.id ?? null;
  const template = specificationValuesApi.useGetApiV1FormByFormIdQuery(formId ? { ...audit, formId } : skipToken);
  const microbial = specificationValuesApi.useGetApiV1FormByFormIdQuery(microbialFormId ? { ...audit, formId: microbialFormId } : skipToken);
  const saved = specificationValuesApi.useGetApiV1FormSectionQuery(number ? { ...audit, pageSize: 500, [by]: number } : skipToken);
  const parsedTemplate = useMemo(() => template.currentData ? templateSectionsSchema.safeParse(template.currentData) : null, [template.currentData]);
  const parsedMicrobial = useMemo(() => microbial.currentData ? templateSectionsSchema.safeParse(microbial.currentData) : null, [microbial.currentData]);
  const parsedSaved = useMemo(() => saved.currentData ? sectionPageSchema.safeParse(saved.currentData) : null, [saved.currentData]);
  const sections = useMemo(() => {
    const values = parsedSaved?.success ? parsedSaved.data : [];
    const chemical = parsedTemplate?.success ? asAnalysis(withSavedValues(parsedTemplate.data.sections, values), "chemical") : [];
    const micro = parsedMicrobial?.success ? asAnalysis(withSavedValues(parsedMicrobial.data.sections, values), "microbial") : [];
    return [...chemical, ...micro];
  }, [parsedTemplate, parsedMicrobial, parsedSaved]);
  const error = template.error ? apiErrorMessage(template.error) : microbial.error ? apiErrorMessage(microbial.error) : saved.error ? apiErrorMessage(saved.error)
    : [parsedTemplate, parsedMicrobial, parsedSaved].some((parsed) => parsed && !parsed.success) ? "The server returned tests the app could not read." : null;
  return {
    sections, error,
    loading: (template.isFetching && !template.currentData) || (microbial.isFetching && !microbial.currentData) || (saved.isFetching && !saved.currentData),
    refreshing: template.isFetching || microbial.isFetching || saved.isFetching,
    /** No template: nothing to show or complete. */ noTemplate: specification !== null && !formId,
    retry: () => { if (formId) void template.refetch(); if (microbialFormId) void microbial.refetch(); if (number) void saved.refetch(); },
  };
}
