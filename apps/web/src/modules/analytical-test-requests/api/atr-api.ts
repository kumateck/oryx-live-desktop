import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "Atrs" as const, id: "all" };
const one = (id: string) => ({ type: "Atrs" as const, id });
const work = (bmrId: string) => ({ type: "AtrWork" as const, id: bmrId });

export const atrApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["Atrs", "AtrWork"], endpoints: {
  getApiV1QaAnalyticalTests: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1QaAnalyticalTestsById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [one(arg.id)]); },
  putApiV1QaAnalyticalTestsStatusById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, one(arg.id)]); },
  postApiV1QaAnalyticalTestsRequestRetestById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, one(arg.id)]); },
  postApiV1QaAnalyticalTestsCompleteRetestById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, one(arg.id)]); },
} });
export const atrFormsApi = formsApi.enhanceEndpoints({ addTagTypes: ["Atrs", "AtrWork"], endpoints: {
  getApiV1FormResponse: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [work(arg.batchManufacturingRecordId ?? "")]); },
  getApiV1FormResponsesByFormResponseId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "AtrWork" as const, id: `response:${arg.formResponseId}` }]); },
  getApiV1FormAssigneesBmrByBmrId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [work(arg.bmrId)]); },
  postApiV1FormAssignees: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, "AtrWork"]); },
  postApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, "AtrWork"]); },
} });
