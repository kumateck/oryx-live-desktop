import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { specificationValuesApi } from "./specification-api";
import { sectionPageSchema, templateSectionsSchema, withSavedValues, type Specification } from "./specification-schema";

const audit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;

/**
 * A specification's tests: the template's sections with the reference value saved for each.
 * Material and product values are looked up by their own specification number parameter.
 */
export function useSpecificationTests(specification: Specification | null, by: "materialSpecificationNumber" | "productSpecificationNumber") {
  const number = specification?.specificationNumber ?? null;
  const formId = specification?.form?.id ?? null;
  const template = specificationValuesApi.useGetApiV1FormByFormIdQuery(formId ? { ...audit, formId } : skipToken);
  const saved = specificationValuesApi.useGetApiV1FormSectionQuery(number ? { ...audit, pageSize: 500, [by]: number } : skipToken);
  const parsedTemplate = useMemo(() => template.data ? templateSectionsSchema.safeParse(template.data) : null, [template.data]);
  const parsedSaved = useMemo(() => saved.data ? sectionPageSchema.safeParse(saved.data) : null, [saved.data]);
  const sections = useMemo(() => parsedTemplate?.success ? withSavedValues(parsedTemplate.data.sections, parsedSaved?.success ? parsedSaved.data : []) : [], [parsedTemplate, parsedSaved]);
  const error = template.error ? apiErrorMessage(template.error) : saved.error ? apiErrorMessage(saved.error)
    : (parsedTemplate && !parsedTemplate.success) || (parsedSaved && !parsedSaved.success) ? "The server returned tests the app could not read." : null;
  return {
    sections, error,
    loading: Boolean(formId && template.isLoading) || Boolean(number && saved.isLoading),
    /** No template: nothing to show or complete. */ noTemplate: specification !== null && !formId,
    retry: () => { if (formId) void template.refetch(); if (number) void saved.refetch(); },
  };
}
