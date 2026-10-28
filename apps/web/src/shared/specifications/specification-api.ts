import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

// The reference values set on a specification's tests, kept per specification number.
const values = (number: string) => ({ type: "SpecificationValues" as const, id: number });
export const specificationValuesApi = formsApi.enhanceEndpoints({ addTagTypes: ["SpecificationValues"], endpoints: {
  getApiV1FormSection: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [values(arg.materialSpecificationNumber ?? arg.productSpecificationNumber ?? "")]); },
} });
export const specificationValuesTag = values;
