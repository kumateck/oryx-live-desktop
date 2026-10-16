import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "FormTemplates" as const, id: "all" };
const one = (id: string) => ({ type: "FormTemplates" as const, id });
const all = (_result: unknown, error: unknown) => error ? [] : [list];

export const templatesApi = formsApi.enhanceEndpoints({ addTagTypes: ["FormTemplates"], endpoints: {
  getApiV1Form: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1FormByFormId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.formId)]); },
  postApiV1Form: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, all); },
  deleteApiV1FormByFormId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, all); },
  // The edit is a sequence of writes; the template is reloaded once, after the last one.
} });
export const invalidateTemplate = (id: string) => templatesApi.util.invalidateTags([list, one(id)]);
