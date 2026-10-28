import { settingsApi } from "@/shared/api/generated/settings";
import { addTags } from "@/shared/api/add-tags";
const list = { type: "SettingsAlert" as const, id: "list" };
export const alertAudit = { module: "Settings", subModule: "Alerts" };
export const alertApi = settingsApi.enhanceEndpoints({ addTagTypes: ["SettingsAlert"], endpoints: {
  getApiV1Alert: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1AlertByAlertId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_data, _error, arg) => [{ type: "SettingsAlert", id: arg.alertId }]); },
  postApiV1Alert: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error) => error ? [] : [list]); },
  putApiV1AlertByAlertId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error, arg) => error ? [] : [list, { type: "SettingsAlert", id: arg.alertId }]); },
  deleteApiV1AlertById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error, arg) => error ? [] : [list, { type: "SettingsAlert", id: arg.id }]); },
  putApiV1AlertByIdToggleDisable: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error, arg) => error ? [] : [list, { type: "SettingsAlert", id: arg.id }]); },
} });
