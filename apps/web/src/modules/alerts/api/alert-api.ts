import { settingsApi } from "@/shared/api/generated/settings";
const list = { type: "SettingsAlert" as const, id: "list" };
export const alertAudit = { module: "Settings", subModule: "Alerts" };
export const alertApi = settingsApi.enhanceEndpoints({ addTagTypes: ["SettingsAlert"], endpoints: {
  getApiV1Alert: { providesTags: [list] },
  getApiV1AlertByAlertId: { providesTags: (_data, _error, arg) => [{ type: "SettingsAlert", id: arg.alertId }] },
  postApiV1Alert: { invalidatesTags: (_data, error) => error ? [] : [list] },
  putApiV1AlertByAlertId: { invalidatesTags: (_data, error, arg) => error ? [] : [list, { type: "SettingsAlert", id: arg.alertId }] },
  deleteApiV1AlertById: { invalidatesTags: (_data, error, arg) => error ? [] : [list, { type: "SettingsAlert", id: arg.id }] },
  putApiV1AlertByIdToggleDisable: { invalidatesTags: (_data, error, arg) => error ? [] : [list, { type: "SettingsAlert", id: arg.id }] },
} });
