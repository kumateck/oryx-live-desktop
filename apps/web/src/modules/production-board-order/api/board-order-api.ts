import { settingsApi } from "@/shared/api/generated/settings";
import { identityApi } from "@/shared/api/generated/identity";
import { addTags } from "@/shared/api/add-tags";

const boardOrderApi = settingsApi.enhanceEndpoints({ addTagTypes: ["ProductionBoardOrder", "ConfigurationCollection"], endpoints: {
  getDepartmentProductionBoardOrder: definition => { definition.providesTags = addTags(definition.providesTags,
    (_result, _error, arg) => [{ type: "ProductionBoardOrder", id: arg.departmentId }, { type: "ConfigurationCollection", id: "Operation" }]); },
  saveDepartmentProductionBoardOrder: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags,
    (_result, error, arg) => error ? [] : [{ type: "ProductionBoardOrder", id: arg.departmentId }, { type: "ConfigurationCollection", id: "Operation" }, "ActivityBoard"]); },
} });
export const { useGetDepartmentProductionBoardOrderQuery: useBoardOrderQuery,
  useSaveDepartmentProductionBoardOrderMutation: useSaveBoardOrderMutation } = boardOrderApi;
export const { useGetApiV1DepartmentQuery: useDepartmentsQuery } = identityApi;
