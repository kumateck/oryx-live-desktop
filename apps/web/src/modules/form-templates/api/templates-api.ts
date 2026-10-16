import { formsApi } from "@/shared/api/generated/forms";

const list = { type: "FormTemplates" as const, id: "all" };
const one = (id: string) => ({ type: "FormTemplates" as const, id });
const all = (_result: unknown, error: unknown) => error ? [] : [list];

export const templatesApi = formsApi.enhanceEndpoints({ addTagTypes: ["FormTemplates"], endpoints: {
  getApiV1Form: { providesTags: [list] },
  getApiV1FormByFormId: { providesTags: (_result, _error, arg) => [one(arg.formId)] },
  postApiV1Form: { invalidatesTags: all },
  deleteApiV1FormByFormId: { invalidatesTags: all },
  // The edit is a sequence of writes; the template is reloaded once, after the last one.
} });
export const invalidateTemplate = (id: string) => templatesApi.util.invalidateTags([list, one(id)]);
