import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";

const list = { type: "Atrs" as const, id: "all" };
const one = (id: string) => ({ type: "Atrs" as const, id });
const work = (bmrId: string) => ({ type: "AtrWork" as const, id: bmrId });

export const atrApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["Atrs", "AtrWork"], endpoints: {
  getApiV1QaAnalyticalTests: { providesTags: [list] },
  getApiV1QaAnalyticalTestsById: { providesTags: (_result, _error, arg) => [one(arg.id)] },
  putApiV1QaAnalyticalTestsStatusById: { invalidatesTags: (_result, error, arg) => error ? [] : [list, one(arg.id)] },
  postApiV1QaAnalyticalTestsRequestRetestById: { invalidatesTags: (_result, error, arg) => error ? [] : [list, one(arg.id)] },
  postApiV1QaAnalyticalTestsCompleteRetestById: { invalidatesTags: (_result, error, arg) => error ? [] : [list, one(arg.id)] },
} });
export const atrFormsApi = formsApi.enhanceEndpoints({ addTagTypes: ["Atrs", "AtrWork"], endpoints: {
  getApiV1FormResponse: { providesTags: (_result, _error, arg) => [work(arg.batchManufacturingRecordId ?? "")] },
  getApiV1FormResponsesByFormResponseId: { providesTags: (_result, _error, arg) => [{ type: "AtrWork" as const, id: `response:${arg.formResponseId}` }] },
  getApiV1FormAssigneesBmrByBmrId: { providesTags: (_result, _error, arg) => [work(arg.bmrId)] },
  postApiV1FormAssignees: { invalidatesTags: (_result, error) => error ? [] : [list, "AtrWork"] },
  postApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepId: { invalidatesTags: (_result, error) => error ? [] : [list, "AtrWork"] },
} });
