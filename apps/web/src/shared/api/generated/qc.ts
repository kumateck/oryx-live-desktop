import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiV1QcInstruments: build.query<
      GetApiV1QcInstrumentsApiResponse,
      GetApiV1QcInstrumentsApiArg
    >({
      providesTags: [{ type: "qc/instrument", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/instruments`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1QcInstrumentsById: build.query<
      GetApiV1QcInstrumentsByIdApiResponse,
      GetApiV1QcInstrumentsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/instrument", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/instruments/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcInstrumentsByIdCalibration: build.mutation<
      PutApiV1QcInstrumentsByIdCalibrationApiResponse,
      PutApiV1QcInstrumentsByIdCalibrationApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/instrument", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/instrument", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/instruments/${queryArg.id}/calibration`,
        method: "PUT",
        body: queryArg.domainEntitiesInstrumentsUpdateInstrumentCalibrationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcInstrumentsCalibrationDue: build.query<
      GetApiV1QcInstrumentsCalibrationDueApiResponse,
      GetApiV1QcInstrumentsCalibrationDueApiArg
    >({
      providesTags: [{ type: "qc/instrument", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/instruments/calibration-due`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          withinDays: queryArg.withinDays,
        },
      }),
    }),
    getApiV1QcAiExtractionSettings: build.query<
      GetApiV1QcAiExtractionSettingsApiResponse,
      GetApiV1QcAiExtractionSettingsApiArg
    >({
      providesTags: [{ type: "qc/ai-extraction-setting", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/ai-extraction-settings`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcAiExtractionSettingsByProviderKey: build.mutation<
      PutApiV1QcAiExtractionSettingsByProviderKeyApiResponse,
      PutApiV1QcAiExtractionSettingsByProviderKeyApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/ai-extraction-setting", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/ai-extraction-setting", id: queryArg.provider }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/ai-extraction-settings/${queryArg.provider}/key`,
        method: "PUT",
        body: queryArg.apiControllersSaveAiExtractionProviderKeyRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcAiExtractionSettingsActive: build.mutation<
      PutApiV1QcAiExtractionSettingsActiveApiResponse,
      PutApiV1QcAiExtractionSettingsActiveApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/ai-extraction-setting", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/ai-extraction-settings/active`,
        method: "PUT",
        body: queryArg.apiControllersSetActiveAiExtractionProviderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsCertificates: build.query<
      GetApiV1QcWorksheetsCertificatesApiResponse,
      GetApiV1QcWorksheetsCertificatesApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/certificates`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          shape: queryArg.shape,
          from: queryArg["from"],
          to: queryArg.to,
        },
      }),
    }),
    getApiV1QcWorksheetsCertificatesById: build.query<
      GetApiV1QcWorksheetsCertificatesByIdApiResponse,
      GetApiV1QcWorksheetsCertificatesByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/certificates/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsCertificatesByIdIssue: build.mutation<
      PostApiV1QcWorksheetsCertificatesByIdIssueApiResponse,
      PostApiV1QcWorksheetsCertificatesByIdIssueApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/certificates/${queryArg.id}/issue`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsCertificatesByIdRevise: build.mutation<
      PostApiV1QcWorksheetsCertificatesByIdReviseApiResponse,
      PostApiV1QcWorksheetsCertificatesByIdReviseApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/certificates/${queryArg.id}/revise`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsReviseCoaRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcEquipment: build.mutation<
      PostApiV1QcEquipmentApiResponse,
      PostApiV1QcEquipmentApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc-equipment", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment`,
        method: "POST",
        body: queryArg.domainEntitiesProductsEquipmentsCreateQcEquipment,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcEquipment: build.query<
      GetApiV1QcEquipmentApiResponse,
      GetApiV1QcEquipmentApiArg
    >({
      providesTags: [{ type: "qc-equipment", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1QcEquipmentAll: build.query<
      GetApiV1QcEquipmentAllApiResponse,
      GetApiV1QcEquipmentAllApiArg
    >({
      providesTags: [{ type: "qc-equipment/all", id: "LIST" }, { type: "qc-equipment", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment/all`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcEquipmentById: build.query<
      GetApiV1QcEquipmentByIdApiResponse,
      GetApiV1QcEquipmentByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc-equipment", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcEquipmentById: build.mutation<
      PutApiV1QcEquipmentByIdApiResponse,
      PutApiV1QcEquipmentByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc-equipment", id: "LIST" }, { type: "qc-equipment", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsEquipmentsCreateQcEquipment,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1QcEquipmentById: build.mutation<
      DeleteApiV1QcEquipmentByIdApiResponse,
      DeleteApiV1QcEquipmentByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc-equipment", id: "LIST" }, { type: "qc-equipment", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcEquipmentCalibrationDue: build.query<
      GetApiV1QcEquipmentCalibrationDueApiResponse,
      GetApiV1QcEquipmentCalibrationDueApiArg
    >({
      providesTags: [{ type: "qc-equipment/calibration-due", id: "LIST" }, { type: "qc-equipment", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc-equipment/calibration-due`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          withinDays: queryArg.withinDays,
        },
      }),
    }),
    getApiV1QcWorksheetsMonitoringProgramsSamplingPoints: build.query<
      GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiResponse,
      GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/sampling-points`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
          type: queryArg["type"],
        },
      }),
    }),
    postApiV1QcWorksheetsMonitoringProgramsSamplingPoints: build.mutation<
      PostApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiResponse,
      PostApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/sampling-points`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateSamplingPointRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsMonitoringProgramsSamplingPointsById: build.query<
      GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiResponse,
      GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/sampling-points/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsMonitoringProgramsSamplingPointsById: build.mutation<
      PutApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiResponse,
      PutApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/sampling-points/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateSamplingPointRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1QcWorksheetsMonitoringProgramsSamplingPointsById: build.mutation<
      DeleteApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiResponse,
      DeleteApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/sampling-points/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsMonitoringPrograms: build.query<
      GetApiV1QcWorksheetsMonitoringProgramsApiResponse,
      GetApiV1QcWorksheetsMonitoringProgramsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          samplingPointType: queryArg.samplingPointType,
          samplingPointId: queryArg.samplingPointId,
        },
      }),
    }),
    postApiV1QcWorksheetsMonitoringPrograms: build.mutation<
      PostApiV1QcWorksheetsMonitoringProgramsApiResponse,
      PostApiV1QcWorksheetsMonitoringProgramsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateMonitoringProgramRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsMonitoringProgramsById: build.query<
      GetApiV1QcWorksheetsMonitoringProgramsByIdApiResponse,
      GetApiV1QcWorksheetsMonitoringProgramsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsMonitoringProgramsById: build.mutation<
      PutApiV1QcWorksheetsMonitoringProgramsByIdApiResponse,
      PutApiV1QcWorksheetsMonitoringProgramsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateMonitoringProgramRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsMonitoringProgramsByIdPause: build.mutation<
      PostApiV1QcWorksheetsMonitoringProgramsByIdPauseApiResponse,
      PostApiV1QcWorksheetsMonitoringProgramsByIdPauseApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/${queryArg.id}/pause`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsMonitoringProgramsByIdResume: build.mutation<
      PostApiV1QcWorksheetsMonitoringProgramsByIdResumeApiResponse,
      PostApiV1QcWorksheetsMonitoringProgramsByIdResumeApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/${queryArg.id}/resume`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsMonitoringProgramsScan: build.mutation<
      PostApiV1QcWorksheetsMonitoringProgramsScanApiResponse,
      PostApiV1QcWorksheetsMonitoringProgramsScanApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/monitoring-programs/scan`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsOosCases: build.query<
      GetApiV1QcWorksheetsOosCasesApiResponse,
      GetApiV1QcWorksheetsOosCasesApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1QcWorksheetsOosCasesById: build.query<
      GetApiV1QcWorksheetsOosCasesByIdApiResponse,
      GetApiV1QcWorksheetsOosCasesByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsOosCasesByIdStartInvestigation: build.mutation<
      PostApiV1QcWorksheetsOosCasesByIdStartInvestigationApiResponse,
      PostApiV1QcWorksheetsOosCasesByIdStartInvestigationApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases/${queryArg.id}/start-investigation`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsOosCasesByIdInvestigation: build.mutation<
      PutApiV1QcWorksheetsOosCasesByIdInvestigationApiResponse,
      PutApiV1QcWorksheetsOosCasesByIdInvestigationApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases/${queryArg.id}/investigation`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateOosInvestigationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsOosCasesByIdAuthorizeRetest: build.mutation<
      PostApiV1QcWorksheetsOosCasesByIdAuthorizeRetestApiResponse,
      PostApiV1QcWorksheetsOosCasesByIdAuthorizeRetestApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases/${queryArg.id}/authorize-retest`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsAuthorizeOosRetestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsOosCasesByIdEscalate: build.mutation<
      PostApiV1QcWorksheetsOosCasesByIdEscalateApiResponse,
      PostApiV1QcWorksheetsOosCasesByIdEscalateApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases/${queryArg.id}/escalate`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsEscalateOosCaseRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsOosCasesByIdDisposition: build.mutation<
      PostApiV1QcWorksheetsOosCasesByIdDispositionApiResponse,
      PostApiV1QcWorksheetsOosCasesByIdDispositionApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/oos-cases/${queryArg.id}/disposition`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsOosDispositionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsSamplingPointGroups: build.query<
      GetApiV1QcWorksheetsSamplingPointGroupsApiResponse,
      GetApiV1QcWorksheetsSamplingPointGroupsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/sampling-point-groups`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    postApiV1QcWorksheetsSamplingPointGroups: build.mutation<
      PostApiV1QcWorksheetsSamplingPointGroupsApiResponse,
      PostApiV1QcWorksheetsSamplingPointGroupsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/sampling-point-groups`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateSamplingPointGroupRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsSamplingPointGroupsById: build.query<
      GetApiV1QcWorksheetsSamplingPointGroupsByIdApiResponse,
      GetApiV1QcWorksheetsSamplingPointGroupsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/sampling-point-groups/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsSamplingPointGroupsById: build.mutation<
      PutApiV1QcWorksheetsSamplingPointGroupsByIdApiResponse,
      PutApiV1QcWorksheetsSamplingPointGroupsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/sampling-point-groups/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateSamplingPointGroupRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1QcWorksheetsSamplingPointGroupsById: build.mutation<
      DeleteApiV1QcWorksheetsSamplingPointGroupsByIdApiResponse,
      DeleteApiV1QcWorksheetsSamplingPointGroupsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/sampling-point-groups/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsSpecifications: build.query<
      GetApiV1QcWorksheetsSpecificationsApiResponse,
      GetApiV1QcWorksheetsSpecificationsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          appliesTo: queryArg.appliesTo,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecifications: build.mutation<
      PostApiV1QcWorksheetsSpecificationsApiResponse,
      PostApiV1QcWorksheetsSpecificationsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsSpecificationsById: build.query<
      GetApiV1QcWorksheetsSpecificationsByIdApiResponse,
      GetApiV1QcWorksheetsSpecificationsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsSpecificationsById: build.mutation<
      PutApiV1QcWorksheetsSpecificationsByIdApiResponse,
      PutApiV1QcWorksheetsSpecificationsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsSpecificationsByIdAvailableFields: build.query<
      GetApiV1QcWorksheetsSpecificationsByIdAvailableFieldsApiResponse,
      GetApiV1QcWorksheetsSpecificationsByIdAvailableFieldsApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/available-fields`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecificationsByIdCreateNewVersion: build.mutation<
      PostApiV1QcWorksheetsSpecificationsByIdCreateNewVersionApiResponse,
      PostApiV1QcWorksheetsSpecificationsByIdCreateNewVersionApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/create-new-version`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecificationsByIdSubmitForReview: build.mutation<
      PostApiV1QcWorksheetsSpecificationsByIdSubmitForReviewApiResponse,
      PostApiV1QcWorksheetsSpecificationsByIdSubmitForReviewApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/submit-for-review`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecificationsByIdApprove: build.mutation<
      PostApiV1QcWorksheetsSpecificationsByIdApproveApiResponse,
      PostApiV1QcWorksheetsSpecificationsByIdApproveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/approve`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecificationsByIdReject: build.mutation<
      PostApiV1QcWorksheetsSpecificationsByIdRejectApiResponse,
      PostApiV1QcWorksheetsSpecificationsByIdRejectApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/reject`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecificationsByIdMakeEffective: build.mutation<
      PostApiV1QcWorksheetsSpecificationsByIdMakeEffectiveApiResponse,
      PostApiV1QcWorksheetsSpecificationsByIdMakeEffectiveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/make-effective`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsSpecificationsByIdSupersede: build.mutation<
      PostApiV1QcWorksheetsSpecificationsByIdSupersedeApiResponse,
      PostApiV1QcWorksheetsSpecificationsByIdSupersedeApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/specifications/${queryArg.id}/supersede`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcSupersedeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcSpecificationProposals: build.mutation<
      PostApiV1QcSpecificationProposalsApiResponse,
      PostApiV1QcSpecificationProposalsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/specification-proposal", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/specification-proposals`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateSpecificationProposalSetRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcSpecificationProposals: build.query<
      GetApiV1QcSpecificationProposalsApiResponse,
      GetApiV1QcSpecificationProposalsApiArg
    >({
      providesTags: [{ type: "qc/specification-proposal", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/specification-proposals`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          family: queryArg.family,
        },
      }),
    }),
    getApiV1QcSpecificationProposalsById: build.query<
      GetApiV1QcSpecificationProposalsByIdApiResponse,
      GetApiV1QcSpecificationProposalsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/specification-proposal", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/specification-proposals/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcSpecificationProposalsDraft: build.mutation<
      PostApiV1QcSpecificationProposalsDraftApiResponse,
      PostApiV1QcSpecificationProposalsDraftApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/specification-proposal", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/specification-proposals/draft`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsSpecificationProposalDraftRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcSpecificationProposalsApply: build.mutation<
      PostApiV1QcSpecificationProposalsApplyApiResponse,
      PostApiV1QcSpecificationProposalsApplyApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/specification-proposal", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/specification-proposals/apply`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsSpecificationProposalApplyRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcSpecificationProposalsByIdDismiss: build.mutation<
      PostApiV1QcSpecificationProposalsByIdDismissApiResponse,
      PostApiV1QcSpecificationProposalsByIdDismissApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/specification-proposal", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/specification-proposal", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/specification-proposals/${queryArg.id}/dismiss`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsSpecificationProposalDismissRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsStps: build.query<
      GetApiV1QcWorksheetsStpsApiResponse,
      GetApiV1QcWorksheetsStpsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    postApiV1QcWorksheetsStps: build.mutation<
      PostApiV1QcWorksheetsStpsApiResponse,
      PostApiV1QcWorksheetsStpsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateStpRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsStpsById: build.query<
      GetApiV1QcWorksheetsStpsByIdApiResponse,
      GetApiV1QcWorksheetsStpsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsStpsById: build.mutation<
      PutApiV1QcWorksheetsStpsByIdApiResponse,
      PutApiV1QcWorksheetsStpsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateStpRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsByIdCreateNewVersion: build.mutation<
      PostApiV1QcWorksheetsStpsByIdCreateNewVersionApiResponse,
      PostApiV1QcWorksheetsStpsByIdCreateNewVersionApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}/create-new-version`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsByIdSubmitForReview: build.mutation<
      PostApiV1QcWorksheetsStpsByIdSubmitForReviewApiResponse,
      PostApiV1QcWorksheetsStpsByIdSubmitForReviewApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}/submit-for-review`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsByIdApprove: build.mutation<
      PostApiV1QcWorksheetsStpsByIdApproveApiResponse,
      PostApiV1QcWorksheetsStpsByIdApproveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}/approve`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsByIdReject: build.mutation<
      PostApiV1QcWorksheetsStpsByIdRejectApiResponse,
      PostApiV1QcWorksheetsStpsByIdRejectApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}/reject`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsByIdMakeEffective: build.mutation<
      PostApiV1QcWorksheetsStpsByIdMakeEffectiveApiResponse,
      PostApiV1QcWorksheetsStpsByIdMakeEffectiveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}/make-effective`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsByIdSupersede: build.mutation<
      PostApiV1QcWorksheetsStpsByIdSupersedeApiResponse,
      PostApiV1QcWorksheetsStpsByIdSupersedeApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/${queryArg.id}/supersede`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcSupersedeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsStpsImport: build.mutation<
      PostApiV1QcWorksheetsStpsImportApiResponse,
      PostApiV1QcWorksheetsStpsImportApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/stps/import`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsTestRequests: build.query<
      GetApiV1QcWorksheetsTestRequestsApiResponse,
      GetApiV1QcWorksheetsTestRequestsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/test-requests`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          type: queryArg["type"],
          from: queryArg["from"],
          to: queryArg.to,
        },
      }),
    }),
    postApiV1QcWorksheetsTestRequests: build.mutation<
      PostApiV1QcWorksheetsTestRequestsApiResponse,
      PostApiV1QcWorksheetsTestRequestsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/test-requests`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateTestRequestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsTestRequestsById: build.query<
      GetApiV1QcWorksheetsTestRequestsByIdApiResponse,
      GetApiV1QcWorksheetsTestRequestsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/test-requests/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTestRequestsByIdSubjects: build.mutation<
      PostApiV1QcWorksheetsTestRequestsByIdSubjectsApiResponse,
      PostApiV1QcWorksheetsTestRequestsByIdSubjectsApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/test-requests/${queryArg.id}/subjects`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsAddTestRequestSubjectsRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTestRequestsByIdRecordSample: build.mutation<
      PostApiV1QcWorksheetsTestRequestsByIdRecordSampleApiResponse,
      PostApiV1QcWorksheetsTestRequestsByIdRecordSampleApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/test-requests/${queryArg.id}/record-sample`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsRecordTestRequestSampleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsWaterQualityPeriods: build.query<
      GetApiV1QcWorksheetsWaterQualityPeriodsApiResponse,
      GetApiV1QcWorksheetsWaterQualityPeriodsApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/water-quality/periods`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          samplingPointId: queryArg.samplingPointId,
        },
      }),
    }),
    getApiV1QcWorksheetsWaterQualityPeriodsById: build.query<
      GetApiV1QcWorksheetsWaterQualityPeriodsByIdApiResponse,
      GetApiV1QcWorksheetsWaterQualityPeriodsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/water-quality/periods/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsWaterQualityPeriodsByIdActivate: build.mutation<
      PostApiV1QcWorksheetsWaterQualityPeriodsByIdActivateApiResponse,
      PostApiV1QcWorksheetsWaterQualityPeriodsByIdActivateApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/water-quality/periods/${queryArg.id}/activate`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsActivateWaterQualityPeriodRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsWaterQualityPeriodsByIdHold: build.mutation<
      PostApiV1QcWorksheetsWaterQualityPeriodsByIdHoldApiResponse,
      PostApiV1QcWorksheetsWaterQualityPeriodsByIdHoldApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/water-quality/periods/${queryArg.id}/hold`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsHoldWaterQualityPeriodRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsWaterQualityUses: build.mutation<
      PostApiV1QcWorksheetsWaterQualityUsesApiResponse,
      PostApiV1QcWorksheetsWaterQualityUsesApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/water-quality/uses`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsRecordWaterUseRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsApprovalsMyPending: build.query<
      GetApiV1QcWorksheetsApprovalsMyPendingApiResponse,
      GetApiV1QcWorksheetsApprovalsMyPendingApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/approvals/my-pending`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsApprovalsByEntityTypeAndEntityId: build.query<
      GetApiV1QcWorksheetsApprovalsByEntityTypeAndEntityIdApiResponse,
      GetApiV1QcWorksheetsApprovalsByEntityTypeAndEntityIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.entityType }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/approvals/${queryArg.entityType}/${queryArg.entityId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsInstancesById: build.query<
      GetApiV1QcWorksheetsInstancesByIdApiResponse,
      GetApiV1QcWorksheetsInstancesByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsInstancesMyWork: build.query<
      GetApiV1QcWorksheetsInstancesMyWorkApiResponse,
      GetApiV1QcWorksheetsInstancesMyWorkApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/my-work`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          analysisType: queryArg.analysisType,
        },
      }),
    }),
    getApiV1QcWorksheetsInstancesAwaitingReview: build.query<
      GetApiV1QcWorksheetsInstancesAwaitingReviewApiResponse,
      GetApiV1QcWorksheetsInstancesAwaitingReviewApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/awaiting-review`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          analysisType: queryArg.analysisType,
        },
      }),
    }),
    postApiV1QcWorksheetsInstancesByIdAssign: build.mutation<
      PostApiV1QcWorksheetsInstancesByIdAssignApiResponse,
      PostApiV1QcWorksheetsInstancesByIdAssignApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/assign`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsAssignWorksheetInstanceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsInstancesByIdReassign: build.mutation<
      PostApiV1QcWorksheetsInstancesByIdReassignApiResponse,
      PostApiV1QcWorksheetsInstancesByIdReassignApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/reassign`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsReassignWorksheetInstanceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsInstancesByIdStart: build.mutation<
      PostApiV1QcWorksheetsInstancesByIdStartApiResponse,
      PostApiV1QcWorksheetsInstancesByIdStartApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/start`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsInstancesByIdValues: build.mutation<
      PutApiV1QcWorksheetsInstancesByIdValuesApiResponse,
      PutApiV1QcWorksheetsInstancesByIdValuesApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/values`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsSaveWorksheetValuesRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsInstancesByIdSubmit: build.mutation<
      PostApiV1QcWorksheetsInstancesByIdSubmitApiResponse,
      PostApiV1QcWorksheetsInstancesByIdSubmitApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/submit`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsInstancesByIdReview: build.mutation<
      PostApiV1QcWorksheetsInstancesByIdReviewApiResponse,
      PostApiV1QcWorksheetsInstancesByIdReviewApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/review`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsReviewWorksheetInstanceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsInstancesByIdReturnForCorrection: build.mutation<
      PostApiV1QcWorksheetsInstancesByIdReturnForCorrectionApiResponse,
      PostApiV1QcWorksheetsInstancesByIdReturnForCorrectionApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/instances/${queryArg.id}/return-for-correction`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsReturnWorksheetForCorrectionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsTemplates: build.query<
      GetApiV1QcWorksheetsTemplatesApiResponse,
      GetApiV1QcWorksheetsTemplatesApiArg
    >({
      providesTags: [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplates: build.mutation<
      PostApiV1QcWorksheetsTemplatesApiResponse,
      PostApiV1QcWorksheetsTemplatesApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsCreateWorksheetTemplateRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWorksheetsTemplatesById: build.query<
      GetApiV1QcWorksheetsTemplatesByIdApiResponse,
      GetApiV1QcWorksheetsTemplatesByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "qc/worksheet", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QcWorksheetsTemplatesById: build.mutation<
      PutApiV1QcWorksheetsTemplatesByIdApiResponse,
      PutApiV1QcWorksheetsTemplatesByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQcWorksheetsUpdateWorksheetTemplateRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesByIdCreateNewVersion: build.mutation<
      PostApiV1QcWorksheetsTemplatesByIdCreateNewVersionApiResponse,
      PostApiV1QcWorksheetsTemplatesByIdCreateNewVersionApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}/create-new-version`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesByIdSubmitForReview: build.mutation<
      PostApiV1QcWorksheetsTemplatesByIdSubmitForReviewApiResponse,
      PostApiV1QcWorksheetsTemplatesByIdSubmitForReviewApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}/submit-for-review`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesByIdApprove: build.mutation<
      PostApiV1QcWorksheetsTemplatesByIdApproveApiResponse,
      PostApiV1QcWorksheetsTemplatesByIdApproveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}/approve`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesByIdReject: build.mutation<
      PostApiV1QcWorksheetsTemplatesByIdRejectApiResponse,
      PostApiV1QcWorksheetsTemplatesByIdRejectApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}/reject`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesByIdMakeEffective: build.mutation<
      PostApiV1QcWorksheetsTemplatesByIdMakeEffectiveApiResponse,
      PostApiV1QcWorksheetsTemplatesByIdMakeEffectiveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}/make-effective`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesByIdSupersede: build.mutation<
      PostApiV1QcWorksheetsTemplatesByIdSupersedeApiResponse,
      PostApiV1QcWorksheetsTemplatesByIdSupersedeApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }, { type: "qc/worksheet", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/${queryArg.id}/supersede`,
        method: "POST",
        body: queryArg.domainEntitiesQcWorksheetsQcSupersedeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QcWorksheetsTemplatesImport: build.mutation<
      PostApiV1QcWorksheetsTemplatesImportApiResponse,
      PostApiV1QcWorksheetsTemplatesImportApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "qc/worksheet", id: "LIST" }, { type: "qc", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/qc/worksheets/templates/import`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QcWaterQualityCertificates: build.query<
      GetApiV1QcWaterQualityCertificatesApiResponse,
      GetApiV1QcWaterQualityCertificatesApiArg
    >({
      providesTags: [{ type: "qc/water-quality", id: "LIST" }, { type: "qc", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/qc/water-quality/certificates`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as qcApi };
export type GetApiV1QcInstrumentsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesInstrumentsInstrumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcInstrumentsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcInstrumentsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesInstrumentsInstrumentDto;
export type GetApiV1QcInstrumentsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcInstrumentsByIdCalibrationApiResponse = void;
export type PutApiV1QcInstrumentsByIdCalibrationApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesInstrumentsUpdateInstrumentCalibrationRequest: DomainEntitiesInstrumentsUpdateInstrumentCalibrationRequest;
};
export type GetApiV1QcInstrumentsCalibrationDueApiResponse =
  /** status 200 OK */ DomainEntitiesInstrumentsInstrumentDto[];
export type GetApiV1QcInstrumentsCalibrationDueApiArg = {
  withinDays?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcAiExtractionSettingsApiResponse =
  /** status 200 OK */ AppServicesQcWorksheetsWorksheetDocxImportAiExtractionAiExtractionSettingsDto;
export type GetApiV1QcAiExtractionSettingsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcAiExtractionSettingsByProviderKeyApiResponse =
  /** status 200 OK */ AppServicesQcWorksheetsWorksheetDocxImportAiExtractionAiExtractionSettingsDto;
export type PutApiV1QcAiExtractionSettingsByProviderKeyApiArg = {
  provider: DomainEntitiesQcWorksheetsAiExtractionProvider;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  apiControllersSaveAiExtractionProviderKeyRequest: ApiControllersSaveAiExtractionProviderKeyRequest;
};
export type PutApiV1QcAiExtractionSettingsActiveApiResponse =
  /** status 200 OK */ AppServicesQcWorksheetsWorksheetDocxImportAiExtractionAiExtractionSettingsDto;
export type PutApiV1QcAiExtractionSettingsActiveApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  apiControllersSetActiveAiExtractionProviderRequest: ApiControllersSetActiveAiExtractionProviderRequest;
};
export type GetApiV1QcWorksheetsCertificatesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsCoaSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWorksheetsCertificatesApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsCoaStatus;
  shape?: DomainEntitiesQcWorksheetsCoaCertificateShape;
  from?: string;
  to?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsCertificatesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsCoaDetailDto;
export type GetApiV1QcWorksheetsCertificatesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsCertificatesByIdIssueApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsCoaDetailDto;
export type PostApiV1QcWorksheetsCertificatesByIdIssueApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsCertificatesByIdReviseApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsCoaDetailDto;
export type PostApiV1QcWorksheetsCertificatesByIdReviseApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsReviseCoaRequest: DomainEntitiesQcWorksheetsReviseCoaRequest;
};
export type PostApiV1QcEquipmentApiResponse = /** status 200 OK */ string;
export type PostApiV1QcEquipmentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsEquipmentsCreateQcEquipment: DomainEntitiesProductsEquipmentsCreateQcEquipment;
};
export type GetApiV1QcEquipmentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsEquipmentsQcEquipmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcEquipmentApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcEquipmentAllApiResponse =
  /** status 200 OK */ DomainEntitiesProductsEquipmentsQcEquipmentDto[];
export type GetApiV1QcEquipmentAllApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcEquipmentByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsEquipmentsQcEquipmentDto;
export type GetApiV1QcEquipmentByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcEquipmentByIdApiResponse = void;
export type PutApiV1QcEquipmentByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsEquipmentsCreateQcEquipment: DomainEntitiesProductsEquipmentsCreateQcEquipment;
};
export type DeleteApiV1QcEquipmentByIdApiResponse = void;
export type DeleteApiV1QcEquipmentByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcEquipmentCalibrationDueApiResponse =
  /** status 200 OK */ DomainEntitiesProductsEquipmentsQcEquipmentDto[];
export type GetApiV1QcEquipmentCalibrationDueApiArg = {
  withinDays?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointDto[];
export type GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiArg = {
  searchQuery?: string;
  type?: DomainEntitiesQcWorksheetsSamplingPointType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointDto;
export type PostApiV1QcWorksheetsMonitoringProgramsSamplingPointsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateSamplingPointRequest: DomainEntitiesQcWorksheetsCreateSamplingPointRequest;
};
export type GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointDto;
export type GetApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointDto;
export type PutApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateSamplingPointRequest: DomainEntitiesQcWorksheetsUpdateSamplingPointRequest;
};
export type DeleteApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiResponse = void;
export type DeleteApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdApiArg =
  {
    id: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1QcWorksheetsMonitoringProgramsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringProgramDto[];
export type GetApiV1QcWorksheetsMonitoringProgramsApiArg = {
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsMonitoringProgramStatus;
  samplingPointType?: DomainEntitiesQcWorksheetsSamplingPointType;
  samplingPointId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsMonitoringProgramsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringProgramDto;
export type PostApiV1QcWorksheetsMonitoringProgramsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateMonitoringProgramRequest: DomainEntitiesQcWorksheetsCreateMonitoringProgramRequest;
};
export type GetApiV1QcWorksheetsMonitoringProgramsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringProgramDto;
export type GetApiV1QcWorksheetsMonitoringProgramsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsMonitoringProgramsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringProgramDto;
export type PutApiV1QcWorksheetsMonitoringProgramsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateMonitoringProgramRequest: DomainEntitiesQcWorksheetsUpdateMonitoringProgramRequest;
};
export type PostApiV1QcWorksheetsMonitoringProgramsByIdPauseApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringProgramDto;
export type PostApiV1QcWorksheetsMonitoringProgramsByIdPauseApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsMonitoringProgramsByIdResumeApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringProgramDto;
export type PostApiV1QcWorksheetsMonitoringProgramsByIdResumeApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsMonitoringProgramsScanApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsMonitoringScanResultDto;
export type PostApiV1QcWorksheetsMonitoringProgramsScanApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsOosCasesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsOosCaseSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWorksheetsOosCasesApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsOosCaseStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsOosCasesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsOosCaseDetailDto;
export type GetApiV1QcWorksheetsOosCasesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsOosCasesByIdStartInvestigationApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsOosCaseDetailDto;
export type PostApiV1QcWorksheetsOosCasesByIdStartInvestigationApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsOosCasesByIdInvestigationApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsOosCaseDetailDto;
export type PutApiV1QcWorksheetsOosCasesByIdInvestigationApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateOosInvestigationRequest: DomainEntitiesQcWorksheetsUpdateOosInvestigationRequest;
};
export type PostApiV1QcWorksheetsOosCasesByIdAuthorizeRetestApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsOosCaseDetailDto;
export type PostApiV1QcWorksheetsOosCasesByIdAuthorizeRetestApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsAuthorizeOosRetestRequest: DomainEntitiesQcWorksheetsAuthorizeOosRetestRequest;
};
export type PostApiV1QcWorksheetsOosCasesByIdEscalateApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsOosCaseDetailDto;
export type PostApiV1QcWorksheetsOosCasesByIdEscalateApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsEscalateOosCaseRequest: DomainEntitiesQcWorksheetsEscalateOosCaseRequest;
};
export type PostApiV1QcWorksheetsOosCasesByIdDispositionApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsOosCaseDetailDto;
export type PostApiV1QcWorksheetsOosCasesByIdDispositionApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsOosDispositionRequest: DomainEntitiesQcWorksheetsOosDispositionRequest;
};
export type GetApiV1QcWorksheetsSamplingPointGroupsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointGroupDto[];
export type GetApiV1QcWorksheetsSamplingPointGroupsApiArg = {
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsSamplingPointGroupsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointGroupDto;
export type PostApiV1QcWorksheetsSamplingPointGroupsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateSamplingPointGroupRequest: DomainEntitiesQcWorksheetsCreateSamplingPointGroupRequest;
};
export type GetApiV1QcWorksheetsSamplingPointGroupsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointGroupDto;
export type GetApiV1QcWorksheetsSamplingPointGroupsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsSamplingPointGroupsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSamplingPointGroupDto;
export type PutApiV1QcWorksheetsSamplingPointGroupsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateSamplingPointGroupRequest: DomainEntitiesQcWorksheetsUpdateSamplingPointGroupRequest;
};
export type DeleteApiV1QcWorksheetsSamplingPointGroupsByIdApiResponse = void;
export type DeleteApiV1QcWorksheetsSamplingPointGroupsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsSpecificationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsSpecificationSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWorksheetsSpecificationsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  appliesTo?: DomainEntitiesQcWorksheetsSpecificationAppliesTo;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsSpecificationsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateSpecificationRequest: DomainEntitiesQcWorksheetsCreateSpecificationRequest;
};
export type GetApiV1QcWorksheetsSpecificationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type GetApiV1QcWorksheetsSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsSpecificationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PutApiV1QcWorksheetsSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateSpecificationRequest: DomainEntitiesQcWorksheetsUpdateSpecificationRequest;
};
export type GetApiV1QcWorksheetsSpecificationsByIdAvailableFieldsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationAvailableFieldDto[];
export type GetApiV1QcWorksheetsSpecificationsByIdAvailableFieldsApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsSpecificationsByIdCreateNewVersionApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsByIdCreateNewVersionApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsSpecificationsByIdSubmitForReviewApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsByIdSubmitForReviewApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsSpecificationsByIdApproveApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsByIdApproveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcApprovalRequest: DomainEntitiesQcWorksheetsQcApprovalRequest;
};
export type PostApiV1QcWorksheetsSpecificationsByIdRejectApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsByIdRejectApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcApprovalRequest: DomainEntitiesQcWorksheetsQcApprovalRequest;
};
export type PostApiV1QcWorksheetsSpecificationsByIdMakeEffectiveApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsByIdMakeEffectiveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsSpecificationsByIdSupersedeApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDetailDto;
export type PostApiV1QcWorksheetsSpecificationsByIdSupersedeApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcSupersedeRequest: DomainEntitiesQcWorksheetsQcSupersedeRequest;
};
export type PostApiV1QcSpecificationProposalsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationProposalSetDetailDto;
export type PostApiV1QcSpecificationProposalsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateSpecificationProposalSetRequest: DomainEntitiesQcWorksheetsCreateSpecificationProposalSetRequest;
};
export type GetApiV1QcSpecificationProposalsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationProposalSetSummaryDto[];
export type GetApiV1QcSpecificationProposalsApiArg = {
  status?: DomainEntitiesQcWorksheetsSpecificationProposalStatus;
  family?: DomainEntitiesQcWorksheetsArdFamily;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcSpecificationProposalsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationProposalSetDetailDto;
export type GetApiV1QcSpecificationProposalsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcSpecificationProposalsDraftApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationDraftPlan;
export type PostApiV1QcSpecificationProposalsDraftApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsSpecificationProposalDraftRequest: DomainEntitiesQcWorksheetsSpecificationProposalDraftRequest;
};
export type PostApiV1QcSpecificationProposalsApplyApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationProposalApplyResult;
export type PostApiV1QcSpecificationProposalsApplyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsSpecificationProposalApplyRequest: DomainEntitiesQcWorksheetsSpecificationProposalApplyRequest;
};
export type PostApiV1QcSpecificationProposalsByIdDismissApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsSpecificationProposalSetDetailDto;
export type PostApiV1QcSpecificationProposalsByIdDismissApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsSpecificationProposalDismissRequest: DomainEntitiesQcWorksheetsSpecificationProposalDismissRequest;
};
export type GetApiV1QcWorksheetsStpsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsStpSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWorksheetsStpsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsStpsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateStpRequest: DomainEntitiesQcWorksheetsCreateStpRequest;
};
export type GetApiV1QcWorksheetsStpsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type GetApiV1QcWorksheetsStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsStpsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PutApiV1QcWorksheetsStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateStpRequest: DomainEntitiesQcWorksheetsUpdateStpRequest;
};
export type PostApiV1QcWorksheetsStpsByIdCreateNewVersionApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsByIdCreateNewVersionApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsStpsByIdSubmitForReviewApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsByIdSubmitForReviewApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsStpsByIdApproveApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsByIdApproveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcApprovalRequest: DomainEntitiesQcWorksheetsQcApprovalRequest;
};
export type PostApiV1QcWorksheetsStpsByIdRejectApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsByIdRejectApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcApprovalRequest: DomainEntitiesQcWorksheetsQcApprovalRequest;
};
export type PostApiV1QcWorksheetsStpsByIdMakeEffectiveApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsByIdMakeEffectiveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsStpsByIdSupersedeApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpDetailDto;
export type PostApiV1QcWorksheetsStpsByIdSupersedeApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcSupersedeRequest: DomainEntitiesQcWorksheetsQcSupersedeRequest;
};
export type PostApiV1QcWorksheetsStpsImportApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsStpImportResultDto[];
export type PostApiV1QcWorksheetsStpsImportApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsTestRequestsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsTestRequestSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWorksheetsTestRequestsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsTestRequestStatus;
  type?: DomainEntitiesQcWorksheetsTestRequestType;
  from?: string;
  to?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsTestRequestsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsTestRequestDetailDto;
export type PostApiV1QcWorksheetsTestRequestsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateTestRequestRequest: DomainEntitiesQcWorksheetsCreateTestRequestRequest;
};
export type GetApiV1QcWorksheetsTestRequestsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsTestRequestDetailDto;
export type GetApiV1QcWorksheetsTestRequestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsTestRequestsByIdSubjectsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsTestRequestDetailDto;
export type PostApiV1QcWorksheetsTestRequestsByIdSubjectsApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsAddTestRequestSubjectsRequest: DomainEntitiesQcWorksheetsAddTestRequestSubjectsRequest;
};
export type PostApiV1QcWorksheetsTestRequestsByIdRecordSampleApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsTestRequestDetailDto;
export type PostApiV1QcWorksheetsTestRequestsByIdRecordSampleApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsRecordTestRequestSampleRequest: DomainEntitiesQcWorksheetsRecordTestRequestSampleRequest;
};
export type GetApiV1QcWorksheetsWaterQualityPeriodsApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWaterQualityPeriodSummaryDto[];
export type GetApiV1QcWorksheetsWaterQualityPeriodsApiArg = {
  status?: DomainEntitiesQcWorksheetsWaterQualityPeriodStatus;
  samplingPointId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsWaterQualityPeriodsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWaterQualityPeriodDetailDto;
export type GetApiV1QcWorksheetsWaterQualityPeriodsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsWaterQualityPeriodsByIdActivateApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWaterQualityPeriodDetailDto;
export type PostApiV1QcWorksheetsWaterQualityPeriodsByIdActivateApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsActivateWaterQualityPeriodRequest: DomainEntitiesQcWorksheetsActivateWaterQualityPeriodRequest;
};
export type PostApiV1QcWorksheetsWaterQualityPeriodsByIdHoldApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWaterQualityPeriodDetailDto;
export type PostApiV1QcWorksheetsWaterQualityPeriodsByIdHoldApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsHoldWaterQualityPeriodRequest: DomainEntitiesQcWorksheetsHoldWaterQualityPeriodRequest;
};
export type PostApiV1QcWorksheetsWaterQualityUsesApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWaterUseRecordDto;
export type PostApiV1QcWorksheetsWaterQualityUsesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsRecordWaterUseRequest: DomainEntitiesQcWorksheetsRecordWaterUseRequest;
};
export type GetApiV1QcWorksheetsApprovalsMyPendingApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsQcPendingApprovalDto[];
export type GetApiV1QcWorksheetsApprovalsMyPendingApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsApprovalsByEntityTypeAndEntityIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsQcApprovalDto[];
export type GetApiV1QcWorksheetsApprovalsByEntityTypeAndEntityIdApiArg = {
  entityType: string;
  entityId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsInstancesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type GetApiV1QcWorksheetsInstancesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsInstancesMyWorkApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetQueueDto;
export type GetApiV1QcWorksheetsInstancesMyWorkApiArg = {
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWorksheetsInstancesAwaitingReviewApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetQueueDto;
export type GetApiV1QcWorksheetsInstancesAwaitingReviewApiArg = {
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsInstancesByIdAssignApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PostApiV1QcWorksheetsInstancesByIdAssignApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsAssignWorksheetInstanceRequest: DomainEntitiesQcWorksheetsAssignWorksheetInstanceRequest;
};
export type PostApiV1QcWorksheetsInstancesByIdReassignApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PostApiV1QcWorksheetsInstancesByIdReassignApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsReassignWorksheetInstanceRequest: DomainEntitiesQcWorksheetsReassignWorksheetInstanceRequest;
};
export type PostApiV1QcWorksheetsInstancesByIdStartApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PostApiV1QcWorksheetsInstancesByIdStartApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsInstancesByIdValuesApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PutApiV1QcWorksheetsInstancesByIdValuesApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsSaveWorksheetValuesRequest: DomainEntitiesQcWorksheetsSaveWorksheetValuesRequest;
};
export type PostApiV1QcWorksheetsInstancesByIdSubmitApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PostApiV1QcWorksheetsInstancesByIdSubmitApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsInstancesByIdReviewApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PostApiV1QcWorksheetsInstancesByIdReviewApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsReviewWorksheetInstanceRequest: DomainEntitiesQcWorksheetsReviewWorksheetInstanceRequest;
};
export type PostApiV1QcWorksheetsInstancesByIdReturnForCorrectionApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto;
export type PostApiV1QcWorksheetsInstancesByIdReturnForCorrectionApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsReturnWorksheetForCorrectionRequest: DomainEntitiesQcWorksheetsReturnWorksheetForCorrectionRequest;
};
export type GetApiV1QcWorksheetsTemplatesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsWorksheetTemplateSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWorksheetsTemplatesApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsTemplatesApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsCreateWorksheetTemplateRequest: DomainEntitiesQcWorksheetsCreateWorksheetTemplateRequest;
};
export type GetApiV1QcWorksheetsTemplatesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type GetApiV1QcWorksheetsTemplatesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QcWorksheetsTemplatesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PutApiV1QcWorksheetsTemplatesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsUpdateWorksheetTemplateRequest: DomainEntitiesQcWorksheetsUpdateWorksheetTemplateRequest;
};
export type PostApiV1QcWorksheetsTemplatesByIdCreateNewVersionApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesByIdCreateNewVersionApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsTemplatesByIdSubmitForReviewApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesByIdSubmitForReviewApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsTemplatesByIdApproveApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesByIdApproveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcApprovalRequest: DomainEntitiesQcWorksheetsQcApprovalRequest;
};
export type PostApiV1QcWorksheetsTemplatesByIdRejectApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesByIdRejectApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcApprovalRequest: DomainEntitiesQcWorksheetsQcApprovalRequest;
};
export type PostApiV1QcWorksheetsTemplatesByIdMakeEffectiveApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesByIdMakeEffectiveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QcWorksheetsTemplatesByIdSupersedeApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto;
export type PostApiV1QcWorksheetsTemplatesByIdSupersedeApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQcWorksheetsQcSupersedeRequest: DomainEntitiesQcWorksheetsQcSupersedeRequest;
};
export type PostApiV1QcWorksheetsTemplatesImportApiResponse =
  /** status 200 OK */ DomainEntitiesQcWorksheetsWorksheetImportProposal[];
export type PostApiV1QcWorksheetsTemplatesImportApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QcWaterQualityCertificatesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQualityRoutinesEligibleWaterCertificateDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QcWaterQualityCertificatesApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesProductsDivision = 0 | 1;
export type SharedCollectionItemDto = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
  uom?: string | null;
};
export type DomainEntitiesDepartmentsDepartmentListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
};
export type DomainEntitiesUsersUserDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isDisabled?: boolean;
  avatar?: string | null;
  createdAt?: string;
  signature?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesInstrumentsInstrumentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesInstrumentsInstrumentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesInstrumentsInstrumentQualificationStatus;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesInstrumentsInstrumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesInstrumentsInstrumentDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesInstrumentsUpdateInstrumentCalibrationRequest = {
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesInstrumentsInstrumentQualificationStatus;
};
export type DomainEntitiesQcWorksheetsAiExtractionProvider = 0 | 1;
export type AppServicesQcWorksheetsWorksheetDocxImportAiExtractionAiExtractionProviderStatusDto =
  {
    provider?: DomainEntitiesQcWorksheetsAiExtractionProvider;
    model?: string | null;
    hasKey?: boolean;
    keyPreview?: string | null;
    updatedById?: string | null;
    updatedByName?: string | null;
    updatedAt?: string | null;
  };
export type AppServicesQcWorksheetsWorksheetDocxImportAiExtractionAiExtractionSettingsDto =
  {
    activeProvider?: DomainEntitiesQcWorksheetsAiExtractionProvider;
    providers?:
      | AppServicesQcWorksheetsWorksheetDocxImportAiExtractionAiExtractionProviderStatusDto[]
      | null;
  };
export type ApiControllersSaveAiExtractionProviderKeyRequest = {
  model?: string | null;
  apiKey?: string | null;
};
export type ApiControllersSetActiveAiExtractionProviderRequest = {
  provider?: DomainEntitiesQcWorksheetsAiExtractionProvider;
};
export type DomainEntitiesQcWorksheetsCoaCertificateShape = 0 | 1;
export type DomainEntitiesQcWorksheetsCoaStatus = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsCoaSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testRequestId?: string;
  certificateCode?: string | null;
  certificateShape?: DomainEntitiesQcWorksheetsCoaCertificateShape;
  status?: DomainEntitiesQcWorksheetsCoaStatus;
  revisionNumber?: number;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  subject?: string | null;
  arNumber?: string | null;
  specificationCode?: string | null;
  specificationVersion?: number;
  overallComplies?: boolean;
  supersedesId?: string | null;
  supersededById?: string | null;
  supersededByCertificateCode?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsCoaSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQcWorksheetsCoaSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsCoaHeaderDto = {
  certificateCode?: string | null;
  specificationCode?: string | null;
  specificationVersion?: number;
  specificationRevision?: string | null;
  sampleDate?: string | null;
  testCompletionDate?: string | null;
};
export type DomainEntitiesQcWorksheetsOosDispositionOutcome = 1 | 2 | 3;
export type DomainEntitiesQcWorksheetsCoaRowDto = {
  id?: string;
  testRequestSubjectId?: string;
  specificationCharacteristicId?: string;
  sourceWorksheetInstanceId?: string | null;
  displayLabel?: string | null;
  groupName?: string | null;
  displayOrder?: number;
  acceptanceCriteria?: string | null;
  resultValue?: string | null;
  complies?: boolean;
  dispositionOutcome?: DomainEntitiesQcWorksheetsOosDispositionOutcome;
  dispositionReason?: string | null;
  complianceLabel?: string | null;
  isUnresolvedFailure?: boolean;
};
export type DomainEntitiesQcWorksheetsCoaRowGroupDto = {
  groupName?: string | null;
  rows?: DomainEntitiesQcWorksheetsCoaRowDto[] | null;
};
export type DomainEntitiesQcWorksheetsCoaSubjectGroupDto = {
  testRequestSubjectId?: string;
  subjectRef?: string | null;
  subjectLabel?: string | null;
  complies?: boolean;
  groups?: DomainEntitiesQcWorksheetsCoaRowGroupDto[] | null;
};
export type DomainEntitiesQcWorksheetsCoaDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testRequestId?: string;
  certificateCode?: string | null;
  certificateShape?: DomainEntitiesQcWorksheetsCoaCertificateShape;
  status?: DomainEntitiesQcWorksheetsCoaStatus;
  revisionNumber?: number;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  subject?: string | null;
  arNumber?: string | null;
  specificationCode?: string | null;
  specificationVersion?: number;
  overallComplies?: boolean;
  supersedesId?: string | null;
  supersededById?: string | null;
  supersededByCertificateCode?: string | null;
  header?: DomainEntitiesQcWorksheetsCoaHeaderDto;
  supersedesCertificateCode?: string | null;
  revisionReason?: string | null;
  subjects?: DomainEntitiesQcWorksheetsCoaSubjectGroupDto[] | null;
};
export type DomainEntitiesQcWorksheetsReviseCoaRequest = {
  reason: string;
  password: string;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductsEquipmentsCreateQcEquipment = {
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategoryId?: string;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsEquipmentsQcEquipmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsEquipmentsQcEquipmentDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsSamplingPointType = 0 | 1;
export type DomainEntitiesQcWorksheetsSamplingPointGroupDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesQcWorksheetsSamplingPointDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  area?: string | null;
  type?: DomainEntitiesQcWorksheetsSamplingPointType;
  samplingPointGroupId?: string | null;
  samplingPointGroup?: DomainEntitiesQcWorksheetsSamplingPointGroupDto;
};
export type DomainEntitiesQcWorksheetsCreateSamplingPointRequest = {
  code: string;
  name: string;
  area?: string | null;
  type: DomainEntitiesQcWorksheetsSamplingPointType;
  samplingPointGroupId?: string | null;
};
export type DomainEntitiesQcWorksheetsUpdateSamplingPointRequest = {
  code: string;
  name: string;
  area?: string | null;
  type: DomainEntitiesQcWorksheetsSamplingPointType;
  samplingPointGroupId?: string | null;
};
export type DomainEntitiesQcWorksheetsMonitoringFrequency = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsMonitoringProgramStatus = 0 | 1;
export type DomainEntitiesQcWorksheetsMonitoringDueBucket = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsMonitoringProgramDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  samplingPointId?: string;
  samplingPoint?: DomainEntitiesQcWorksheetsSamplingPointDto;
  specificationId?: string;
  specificationVersion?: number;
  specificationCode?: string | null;
  specificationName?: string | null;
  frequency?: DomainEntitiesQcWorksheetsMonitoringFrequency;
  customIntervalDays?: number | null;
  leadTimeDays?: number;
  nextDueDate?: string;
  status?: DomainEntitiesQcWorksheetsMonitoringProgramStatus;
  dueBucket?: DomainEntitiesQcWorksheetsMonitoringDueBucket;
};
export type DomainEntitiesQcWorksheetsCreateMonitoringProgramRequest = {
  samplingPointId: string;
  specificationId: string;
  frequency: DomainEntitiesQcWorksheetsMonitoringFrequency;
  customIntervalDays?: number | null;
  leadTimeDays?: number;
  nextDueDate: string;
};
export type DomainEntitiesQcWorksheetsUpdateMonitoringProgramRequest = {
  samplingPointId: string;
  specificationId: string;
  frequency: DomainEntitiesQcWorksheetsMonitoringFrequency;
  customIntervalDays?: number | null;
  leadTimeDays?: number;
  nextDueDate: string;
};
export type DomainEntitiesQcWorksheetsMonitoringScanSkipDto = {
  monitoringProgramId?: string;
  samplingPointCode?: string | null;
  reason?: string | null;
};
export type DomainEntitiesQcWorksheetsMonitoringScanResultDto = {
  ranAt?: string;
  programsDue?: number;
  programsGenerated?: number;
  testRequestsCreated?: number;
  skipped?: DomainEntitiesQcWorksheetsMonitoringScanSkipDto[] | null;
  waterPeriodsExpired?: number;
  createdTestRequestIds?: string[] | null;
};
export type DomainEntitiesQcWorksheetsOosCaseStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsOosCaseSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  worksheetInstanceId?: string;
  fieldKey?: string | null;
  status?: DomainEntitiesQcWorksheetsOosCaseStatus;
  openedAt?: string;
  observedValue?: string | null;
  breachedLimit?: string | null;
  testName?: string | null;
  testRequestSubjectId?: string;
  subjectRef?: string | null;
  subjectLabel?: string | null;
  testRequestId?: string;
  arNumber?: string | null;
  worksheetTemplateCode?: string | null;
  approved?: boolean;
  dispositionOutcome?: DomainEntitiesQcWorksheetsOosDispositionOutcome;
  retestWorksheetInstanceId?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsOosCaseSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQcWorksheetsOosCaseSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsQcRetestPolicy = 1 | 2;
export type DomainEntitiesQcWorksheetsSpecificationAnalysisType = 0 | 1;
export type DomainEntitiesQcWorksheetsWorksheetInstanceStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsWorksheetInstanceSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testRequestSubjectId?: string;
  worksheetTemplateId?: string;
  worksheetTemplateVersion?: number;
  worksheetTemplateCode?: string | null;
  worksheetTemplateName?: string | null;
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  assignedToId?: string | null;
  assignedTo?: DomainEntitiesUsersUserDto;
  assignedById?: string | null;
  assignedAt?: string | null;
  status?: DomainEntitiesQcWorksheetsWorksheetInstanceStatus;
  approved?: boolean;
  submittedAt?: string | null;
  retestOfInstanceId?: string | null;
};
export type DomainEntitiesQcWorksheetsOosCaseDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  worksheetInstanceId?: string;
  fieldKey?: string | null;
  status?: DomainEntitiesQcWorksheetsOosCaseStatus;
  openedAt?: string;
  observedValue?: string | null;
  breachedLimit?: string | null;
  testName?: string | null;
  testRequestSubjectId?: string;
  subjectRef?: string | null;
  subjectLabel?: string | null;
  testRequestId?: string;
  arNumber?: string | null;
  worksheetTemplateCode?: string | null;
  approved?: boolean;
  dispositionOutcome?: DomainEntitiesQcWorksheetsOosDispositionOutcome;
  retestWorksheetInstanceId?: string | null;
  specificationId?: string;
  specificationVersion?: number;
  specificationCode?: string | null;
  specificationCharacteristicId?: string | null;
  acceptanceCriteria?: string | null;
  alertLimit?: string | null;
  actionLimit?: string | null;
  retestPolicy?: DomainEntitiesQcWorksheetsQcRetestPolicy;
  investigationDetails?: string | null;
  rootCauseAnalysis?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  investigatedBy?: DomainEntitiesUsersUserDto;
  investigatedAt?: string | null;
  retestAuthorizedBy?: DomainEntitiesUsersUserDto;
  retestAuthorizedAt?: string | null;
  worksheetInstance?: DomainEntitiesQcWorksheetsWorksheetInstanceSummaryDto;
  retestWorksheetInstance?: DomainEntitiesQcWorksheetsWorksheetInstanceSummaryDto;
  dispositionBy?: DomainEntitiesUsersUserDto;
  dispositionAt?: string | null;
  dispositionComments?: string | null;
  quarantinedMaterialBatchId?: string | null;
  quarantinedBatchManufacturingRecordId?: string | null;
  blocksRelease?: boolean;
};
export type DomainEntitiesQcWorksheetsUpdateOosInvestigationRequest = {
  investigationDetails?: string | null;
  rootCauseAnalysis?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
};
export type DomainEntitiesQcWorksheetsAuthorizeOosRetestRequest = {
  collectedAt?: string | null;
  arNumber?: string | null;
  reason?: string | null;
};
export type DomainEntitiesQcWorksheetsEscalateOosCaseRequest = {
  reason?: string | null;
};
export type DomainEntitiesQcWorksheetsOosDispositionRequest = {
  outcome?: DomainEntitiesQcWorksheetsOosDispositionOutcome;
  password?: string | null;
  dispositionComments?: string | null;
};
export type DomainEntitiesQcWorksheetsCreateSamplingPointGroupRequest = {
  name: string;
  description?: string | null;
};
export type DomainEntitiesQcWorksheetsUpdateSamplingPointGroupRequest = {
  name: string;
  description?: string | null;
};
export type DomainEntitiesQcWorksheetsSpecificationAppliesTo =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsSpecificationStage = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsQcDocumentStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsSpecificationSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  appliesTo?: DomainEntitiesQcWorksheetsSpecificationAppliesTo;
  stage?: DomainEntitiesQcWorksheetsSpecificationStage;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  approved?: boolean;
  retestPolicy?: DomainEntitiesQcWorksheetsQcRetestPolicy;
  effectiveDate?: string | null;
  supersedesId?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsSpecificationSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQcWorksheetsSpecificationSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsWorksheetCategory = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsWorksheetTemplateReferenceDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  version?: number;
  category?: DomainEntitiesQcWorksheetsWorksheetCategory;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
};
export type DomainEntitiesQcWorksheetsSpecificationWorksheetLinkDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  worksheetTemplateId?: string;
  worksheetTemplateVersion?: number;
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  worksheetTemplate?: DomainEntitiesQcWorksheetsWorksheetTemplateReferenceDto;
};
export type DomainEntitiesQcWorksheetsSpecificationCharacteristicDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testName?: string | null;
  analyte?: string | null;
  acceptanceCriteria?: string | null;
  alertLimit?: string | null;
  actionLimit?: string | null;
  samplingPointGroupId?: string | null;
  samplingPointGroup?: DomainEntitiesQcWorksheetsSamplingPointGroupDto;
  sourceWorksheetTemplateId?: string;
  sourceFieldKey?: string | null;
  includeOnCoa?: boolean;
  displayOrder?: number;
  groupName?: string | null;
};
export type DomainEntitiesQcWorksheetsSpecificationDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  appliesTo?: DomainEntitiesQcWorksheetsSpecificationAppliesTo;
  stage?: DomainEntitiesQcWorksheetsSpecificationStage;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  approved?: boolean;
  retestPolicy?: DomainEntitiesQcWorksheetsQcRetestPolicy;
  effectiveDate?: string | null;
  supersedesId?: string | null;
  worksheetLinks?:
    DomainEntitiesQcWorksheetsSpecificationWorksheetLinkDto[] | null;
  characteristics?:
    DomainEntitiesQcWorksheetsSpecificationCharacteristicDto[] | null;
};
export type DomainEntitiesQcWorksheetsCreateSpecificationWorksheetLinkRequest =
  {
    worksheetTemplateId: string;
    analysisType: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  };
export type DomainEntitiesQcWorksheetsCreateSpecificationCharacteristicRequest =
  {
    testName: string;
    analyte?: string | null;
    acceptanceCriteria: string;
    alertLimit?: string | null;
    actionLimit?: string | null;
    samplingPointGroupId?: string | null;
    sourceWorksheetTemplateId: string;
    sourceFieldKey: string;
    includeOnCoa?: boolean;
    displayOrder?: number;
    groupName?: string | null;
  };
export type DomainEntitiesQcWorksheetsCreateSpecificationRequest = {
  code: string;
  name: string;
  appliesTo: DomainEntitiesQcWorksheetsSpecificationAppliesTo;
  stage?: DomainEntitiesQcWorksheetsSpecificationStage;
  retestPolicy: DomainEntitiesQcWorksheetsQcRetestPolicy;
  worksheetLinks?:
    DomainEntitiesQcWorksheetsCreateSpecificationWorksheetLinkRequest[] | null;
  characteristics?:
    DomainEntitiesQcWorksheetsCreateSpecificationCharacteristicRequest[] | null;
};
export type DomainEntitiesQcWorksheetsUpdateSpecificationRequest = {
  code: string;
  name: string;
  appliesTo: DomainEntitiesQcWorksheetsSpecificationAppliesTo;
  stage?: DomainEntitiesQcWorksheetsSpecificationStage;
  retestPolicy: DomainEntitiesQcWorksheetsQcRetestPolicy;
  worksheetLinks?:
    DomainEntitiesQcWorksheetsCreateSpecificationWorksheetLinkRequest[] | null;
  characteristics?:
    DomainEntitiesQcWorksheetsCreateSpecificationCharacteristicRequest[] | null;
};
export type DomainEntitiesQcWorksheetsWorksheetFieldType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;
export type DomainEntitiesQcWorksheetsWorksheetFieldMode = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsSpecificationAvailableFieldDto = {
  worksheetTemplateId?: string;
  worksheetTemplateCode?: string | null;
  worksheetTemplateName?: string | null;
  worksheetTemplateVersion?: number;
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  sectionName?: string | null;
  fieldKey?: string | null;
  label?: string | null;
  type?: DomainEntitiesQcWorksheetsWorksheetFieldType;
  mode?: DomainEntitiesQcWorksheetsWorksheetFieldMode;
  unit?: string | null;
  analyte?: string | null;
  constantValue?: string | null;
};
export type DomainEntitiesQcWorksheetsQcApprovalRequest = {
  password: string;
  comments?: string | null;
};
export type DomainEntitiesQcWorksheetsQcSupersedeRequest = {
  password: string;
  comments: string;
};
export type DomainEntitiesQcWorksheetsArdFamily = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesQcWorksheetsSpecificationProposalStatus = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsImportConfidence = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsImportSourceLocation = {
  block?: number | null;
  table?: number | null;
  row?: number | null;
  column?: number | null;
  header?: boolean;
};
export type DomainEntitiesQcWorksheetsSpecificationCharacteristicProposal = {
  testName?: string | null;
  analyte?: string | null;
  acceptanceCriteria?: string | null;
  printedCriteria?: string | null;
  alertLimit?: string | null;
  alertLimitSource?: string | null;
  actionLimit?: string | null;
  sourceFieldKey?: string | null;
  sourceWorksheetTemplateId?: string | null;
  groupName?: string | null;
  stage?: DomainEntitiesQcWorksheetsSpecificationStage;
  productName?: string | null;
  specificationCode?: string | null;
  reference?: string | null;
  confidence?: DomainEntitiesQcWorksheetsImportConfidence;
  location?: DomainEntitiesQcWorksheetsImportSourceLocation;
};
export type DomainEntitiesQcWorksheetsSamplingPointGroupProposal = {
  name?: string | null;
  acceptanceCriteria?: string | null;
  printedPoints?: string | null;
  pointCodes?: string[] | null;
  location?: DomainEntitiesQcWorksheetsImportSourceLocation;
};
export type DomainEntitiesQcWorksheetsSpecificationProposalSetDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  family?: DomainEntitiesQcWorksheetsArdFamily;
  sourceFileName?: string | null;
  worksheetTemplateId?: string;
  worksheetTemplate?: DomainEntitiesQcWorksheetsWorksheetTemplateReferenceDto;
  productName?: string | null;
  specificationCode?: string | null;
  status?: DomainEntitiesQcWorksheetsSpecificationProposalStatus;
  characteristicCount?: number;
  tierCount?: number;
  appliedSpecificationId?: string | null;
  dismissReason?: string | null;
  specificationProposals?:
    DomainEntitiesQcWorksheetsSpecificationCharacteristicProposal[] | null;
  samplingPointGroupProposals?:
    DomainEntitiesQcWorksheetsSamplingPointGroupProposal[] | null;
  samplingPointCodes?: string[] | null;
};
export type DomainEntitiesQcWorksheetsCreateSpecificationProposalSetRequest = {
  specificationProposals?:
    DomainEntitiesQcWorksheetsSpecificationCharacteristicProposal[] | null;
  samplingPointGroupProposals?:
    DomainEntitiesQcWorksheetsSamplingPointGroupProposal[] | null;
  samplingPointCodes?: string[] | null;
  family: DomainEntitiesQcWorksheetsArdFamily;
  sourceFileName: string;
  worksheetTemplateId: string;
  productName?: string | null;
  specificationCode?: string | null;
};
export type DomainEntitiesQcWorksheetsSpecificationProposalSetSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  family?: DomainEntitiesQcWorksheetsArdFamily;
  sourceFileName?: string | null;
  worksheetTemplateId?: string;
  worksheetTemplate?: DomainEntitiesQcWorksheetsWorksheetTemplateReferenceDto;
  productName?: string | null;
  specificationCode?: string | null;
  status?: DomainEntitiesQcWorksheetsSpecificationProposalStatus;
  characteristicCount?: number;
  tierCount?: number;
  appliedSpecificationId?: string | null;
  dismissReason?: string | null;
};
export type DomainEntitiesQcWorksheetsSpecificationDraftPlanCharacteristic = {
  testName: string;
  analyte?: string | null;
  acceptanceCriteria: string;
  alertLimit?: string | null;
  actionLimit?: string | null;
  samplingPointGroupId?: string | null;
  sourceWorksheetTemplateId: string;
  sourceFieldKey: string;
  includeOnCoa?: boolean;
  displayOrder?: number;
  groupName?: string | null;
  samplingPointGroupName?: string | null;
};
export type DomainEntitiesQcWorksheetsSpecificationDraftPlanGroup = {
  name?: string | null;
  description?: string | null;
  samplingPointGroupId?: string | null;
  isNew?: boolean;
  pointCodes?: string[] | null;
};
export type DomainEntitiesQcWorksheetsSpecificationDraftPlanWarning = {
  code?: string | null;
  message?: string | null;
};
export type DomainEntitiesQcWorksheetsSpecificationDraftPlan = {
  targetSpecificationId?: string | null;
  family?: DomainEntitiesQcWorksheetsArdFamily;
  code: string;
  name: string;
  appliesTo?: DomainEntitiesQcWorksheetsSpecificationAppliesTo;
  stage?: DomainEntitiesQcWorksheetsSpecificationStage;
  retestPolicy?: DomainEntitiesQcWorksheetsQcRetestPolicy;
  worksheetLinks?:
    DomainEntitiesQcWorksheetsCreateSpecificationWorksheetLinkRequest[] | null;
  characteristics?:
    DomainEntitiesQcWorksheetsSpecificationDraftPlanCharacteristic[] | null;
  groups?: DomainEntitiesQcWorksheetsSpecificationDraftPlanGroup[] | null;
  warnings?: DomainEntitiesQcWorksheetsSpecificationDraftPlanWarning[] | null;
};
export type DomainEntitiesQcWorksheetsSpecificationProposalDraftRequest = {
  proposalSetIds: string[];
};
export type DomainEntitiesQcWorksheetsSpecificationProposalApplyResult = {
  specificationId?: string;
};
export type DomainEntitiesQcWorksheetsSpecificationProposalApplyRequest = {
  proposalSetIds: string[];
  plan: DomainEntitiesQcWorksheetsSpecificationDraftPlan;
};
export type DomainEntitiesQcWorksheetsSpecificationProposalDismissRequest = {
  reason: string;
};
export type DomainEntitiesQcWorksheetsStpSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  area?: string | null;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  approved?: boolean;
  effectiveDate?: string | null;
  reviewDate?: string | null;
  issueDate?: string | null;
  supersedesId?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsStpSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQcWorksheetsStpSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsStpReferenceDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
};
export type DomainEntitiesQcWorksheetsStpStepDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  order?: number;
  title?: string | null;
  instruction?: string | null;
  referencedStp?: DomainEntitiesQcWorksheetsStpReferenceDto;
};
export type DomainEntitiesQcWorksheetsStpDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  area?: string | null;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  approved?: boolean;
  effectiveDate?: string | null;
  reviewDate?: string | null;
  issueDate?: string | null;
  supersedesId?: string | null;
  purpose?: string | null;
  scope?: string | null;
  responsibility?: string | null;
  accountability?: string | null;
  steps?: DomainEntitiesQcWorksheetsStpStepDto[] | null;
};
export type DomainEntitiesQcWorksheetsCreateStpStepRequest = {
  order?: number;
  title?: string | null;
  instruction: string;
  referencedStpId?: string | null;
};
export type DomainEntitiesQcWorksheetsCreateStpRequest = {
  code: string;
  name: string;
  area?: string | null;
  purpose?: string | null;
  scope?: string | null;
  responsibility?: string | null;
  accountability?: string | null;
  reviewDate?: string | null;
  issueDate?: string | null;
  steps?: DomainEntitiesQcWorksheetsCreateStpStepRequest[] | null;
};
export type DomainEntitiesQcWorksheetsUpdateStpRequest = {
  code: string;
  name: string;
  area?: string | null;
  purpose?: string | null;
  scope?: string | null;
  responsibility?: string | null;
  accountability?: string | null;
  reviewDate?: string | null;
  issueDate?: string | null;
  steps?: DomainEntitiesQcWorksheetsCreateStpStepRequest[] | null;
};
export type DomainEntitiesQcWorksheetsStpImportResultDto = {
  fileName?: string | null;
  succeeded?: boolean;
  standardTestProcedureId?: string | null;
  code?: string | null;
  name?: string | null;
  failureReason?: string | null;
  flaggedForReview?: string[] | null;
};
export type DomainEntitiesQcWorksheetsTestRequestType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQcWorksheetsTestRequestScheduleOrigin = 0 | 1;
export type DomainEntitiesQcWorksheetsTestRequestStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesQcWorksheetsTestRequestSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  type?: DomainEntitiesQcWorksheetsTestRequestType;
  specificationId?: string;
  specificationVersion?: number;
  specificationCode?: string | null;
  specificationName?: string | null;
  scheduleOrigin?: DomainEntitiesQcWorksheetsTestRequestScheduleOrigin;
  unscheduledReason?: string | null;
  arNumber?: string | null;
  issueNumber?: string | null;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  status?: DomainEntitiesQcWorksheetsTestRequestStatus;
  subjectCount?: number;
  worksheetInstanceCount?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsTestRequestSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQcWorksheetsTestRequestSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsTestRequestSubjectDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testRequestId?: string;
  subjectRef?: string | null;
  subjectLabel?: string | null;
  arNumber?: string | null;
  samplingPointGroupId?: string | null;
  samplingPointGroup?: DomainEntitiesQcWorksheetsSamplingPointGroupDto;
  samplingPointId?: string | null;
  materialBatchId?: string | null;
  batchManufacturingRecordId?: string | null;
  collectedAt?: string | null;
  worksheetInstances?:
    DomainEntitiesQcWorksheetsWorksheetInstanceSummaryDto[] | null;
};
export type DomainEntitiesQcWorksheetsTestRequestBlockingOosCaseDto = {
  id?: string;
  worksheetInstanceId?: string;
  fieldKey?: string | null;
  status?: DomainEntitiesQcWorksheetsOosCaseStatus;
  openedAt?: string;
};
export type DomainEntitiesQcWorksheetsTestRequestDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  type?: DomainEntitiesQcWorksheetsTestRequestType;
  specificationId?: string;
  specificationVersion?: number;
  specificationCode?: string | null;
  specificationName?: string | null;
  scheduleOrigin?: DomainEntitiesQcWorksheetsTestRequestScheduleOrigin;
  unscheduledReason?: string | null;
  arNumber?: string | null;
  issueNumber?: string | null;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  status?: DomainEntitiesQcWorksheetsTestRequestStatus;
  subjectCount?: number;
  worksheetInstanceCount?: number;
  subjects?: DomainEntitiesQcWorksheetsTestRequestSubjectDto[] | null;
  blocksRelease?: boolean;
  blockingOosCases?:
    DomainEntitiesQcWorksheetsTestRequestBlockingOosCaseDto[] | null;
};
export type DomainEntitiesQcWorksheetsCreateTestRequestSubjectRequest = {
  subjectRef?: string | null;
  subjectLabel?: string | null;
  arNumber?: string | null;
  samplingPointGroupId?: string | null;
  samplingPointId?: string | null;
  materialBatchId?: string | null;
  batchManufacturingRecordId?: string | null;
  collectedAt?: string | null;
};
export type DomainEntitiesQcWorksheetsCreateTestRequestRequest = {
  type: DomainEntitiesQcWorksheetsTestRequestType;
  specificationId: string;
  scheduleOrigin: DomainEntitiesQcWorksheetsTestRequestScheduleOrigin;
  unscheduledReason?: string | null;
  arNumber: string;
  issueNumber?: string | null;
  issuedAt?: string | null;
  subjects?: DomainEntitiesQcWorksheetsCreateTestRequestSubjectRequest[] | null;
};
export type DomainEntitiesQcWorksheetsAddTestRequestSubjectsRequest = {
  subjects: DomainEntitiesQcWorksheetsCreateTestRequestSubjectRequest[];
};
export type DomainEntitiesQcWorksheetsRecordTestRequestSampleRequest = {
  subjectIds?: string[] | null;
  collectedAt?: string | null;
};
export type DomainEntitiesQcWorksheetsWaterQualityPeriodStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesQcWorksheetsWaterQualityPeriodSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  samplingPointId?: string;
  samplingPointCode?: string | null;
  samplingPointName?: string | null;
  testRequestSubjectId?: string;
  testRequestId?: string;
  testRequestArNumber?: string | null;
  validFrom?: string;
  validUntil?: string | null;
  status?: DomainEntitiesQcWorksheetsWaterQualityPeriodStatus;
  retrospectiveReason?: string | null;
  activatedBy?: DomainEntitiesUsersUserDto;
  activatedAt?: string | null;
  holdReason?: string | null;
  heldBy?: DomainEntitiesUsersUserDto;
  heldAt?: string | null;
  useRecordCount?: number;
  heldUseRecordCount?: number;
};
export type DomainEntitiesQcWorksheetsWaterUseRecordStatus = 0 | 1;
export type DomainEntitiesQcWorksheetsWaterUseRecordDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  waterQualityPeriodId?: string;
  usedAt?: string;
  batchManufacturingRecordId?: string | null;
  batchNumber?: string | null;
  productionActivityStepId?: string | null;
  recordedBy?: DomainEntitiesUsersUserDto;
  status?: DomainEntitiesQcWorksheetsWaterUseRecordStatus;
};
export type DomainEntitiesQcWorksheetsWaterQualityPeriodDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  samplingPointId?: string;
  samplingPointCode?: string | null;
  samplingPointName?: string | null;
  testRequestSubjectId?: string;
  testRequestId?: string;
  testRequestArNumber?: string | null;
  validFrom?: string;
  validUntil?: string | null;
  status?: DomainEntitiesQcWorksheetsWaterQualityPeriodStatus;
  retrospectiveReason?: string | null;
  activatedBy?: DomainEntitiesUsersUserDto;
  activatedAt?: string | null;
  holdReason?: string | null;
  heldBy?: DomainEntitiesUsersUserDto;
  heldAt?: string | null;
  useRecordCount?: number;
  heldUseRecordCount?: number;
  useRecords?: DomainEntitiesQcWorksheetsWaterUseRecordDto[] | null;
};
export type DomainEntitiesQcWorksheetsActivateWaterQualityPeriodRequest = {
  retrospectiveReason: string;
};
export type DomainEntitiesQcWorksheetsHoldWaterQualityPeriodRequest = {
  holdReason: string;
};
export type DomainEntitiesQcWorksheetsRecordWaterUseRequest = {
  waterQualityPeriodId: string;
  usedAt: string;
  batchManufacturingRecordId?: string | null;
  productionActivityStepId?: string | null;
};
export type DomainEntitiesQcWorksheetsQcPendingApprovalDto = {
  entityType?: string | null;
  entityId?: string;
  code?: string | null;
  name?: string | null;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  createdAt?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  order?: number;
  approvalRound?: number;
  resourcePath?: string | null;
};
export type DomainEntitiesApprovalsApprovalStatus = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsQcApprovalDto = {
  id?: string;
  entityType?: string | null;
  entityId?: string;
  approvalId?: string;
  approvalRound?: number;
  order?: number;
  required?: boolean;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  reauthConfirmedAt?: string | null;
  activatedAt?: string | null;
  comments?: string | null;
  approvedBy?: DomainEntitiesUsersUserDto;
  user?: DomainEntitiesUsersUserDto;
  roleId?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceHeaderDto = {
  testRequestId?: string;
  testRequestType?: DomainEntitiesQcWorksheetsTestRequestType;
  subjectRef?: string | null;
  subjectLabel?: string | null;
  arNumber?: string | null;
  specificationCode?: string | null;
  specificationVersion?: number;
  specificationRevision?: string | null;
  stpCode?: string | null;
  stpId?: string | null;
  worksheetTemplateCode?: string | null;
  worksheetTemplateName?: string | null;
  worksheetTemplateVersion?: number;
  issueNumber?: string | null;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  sampledOn?: string | null;
  analysisDateFrom?: string | null;
  analysisDateTo?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetFieldValueDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  fieldKey?: string | null;
  rowIndex?: number | null;
  columnKey?: string | null;
  value?: string | null;
  enteredById?: string;
  enteredBy?: DomainEntitiesUsersUserDto;
  enteredAt?: string;
  resolvedFromInstanceId?: string | null;
};
export type DomainEntitiesQcWorksheetsReferencedResultDto = {
  sourceTemplateId?: string | null;
  sourceTemplateCode?: string | null;
  sourceFieldKey?: string | null;
  resolutionFieldKey?: string | null;
  resolutionValue?: string | null;
  resolved?: boolean;
  resolvedFromInstanceId?: string | null;
  value?: string | null;
  message?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceFieldDto = {
  id?: string;
  order?: number;
  fieldKey?: string | null;
  label?: string | null;
  type?: DomainEntitiesQcWorksheetsWorksheetFieldType;
  mode?: DomainEntitiesQcWorksheetsWorksheetFieldMode;
  unit?: string | null;
  analyte?: string | null;
  constantValue?: string | null;
  formulaExpression?: string | null;
  columnDefinitions?: string | null;
  optionsJson?: string | null;
  readOnly?: boolean;
  requiredForSubmission?: boolean;
  values?: DomainEntitiesQcWorksheetsWorksheetFieldValueDto[] | null;
  referencedResult?: DomainEntitiesQcWorksheetsReferencedResultDto;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceSectionDto = {
  id?: string;
  order?: number;
  name?: string | null;
  instrumentId?: string | null;
  fields?: DomainEntitiesQcWorksheetsWorksheetInstanceFieldDto[] | null;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceReassignmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  worksheetInstanceId?: string;
  fromUserId?: string | null;
  fromUser?: DomainEntitiesUsersUserDto;
  toUserId?: string;
  toUser?: DomainEntitiesUsersUserDto;
  reassignedById?: string;
  reassignedBy?: DomainEntitiesUsersUserDto;
  reassignedAt?: string;
  reason?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceCorrectionReturnDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  worksheetInstanceId?: string;
  returnedById?: string;
  returnedBy?: DomainEntitiesUsersUserDto;
  returnedAt?: string;
  reason?: string | null;
  approvalRound?: number;
  signed?: boolean;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceOosCaseDto = {
  id?: string;
  fieldKey?: string | null;
  status?: DomainEntitiesQcWorksheetsOosCaseStatus;
  openedAt?: string;
  observedValue?: string | null;
  breachedLimit?: string | null;
  dispositionOutcome?: DomainEntitiesQcWorksheetsOosDispositionOutcome;
  blocksRelease?: boolean;
  retestWorksheetInstanceId?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetInstanceDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testRequestSubjectId?: string;
  worksheetTemplateId?: string;
  worksheetTemplateVersion?: number;
  worksheetTemplateCode?: string | null;
  worksheetTemplateName?: string | null;
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  assignedToId?: string | null;
  assignedTo?: DomainEntitiesUsersUserDto;
  assignedById?: string | null;
  assignedAt?: string | null;
  status?: DomainEntitiesQcWorksheetsWorksheetInstanceStatus;
  approved?: boolean;
  submittedAt?: string | null;
  retestOfInstanceId?: string | null;
  header?: DomainEntitiesQcWorksheetsWorksheetInstanceHeaderDto;
  sections?: DomainEntitiesQcWorksheetsWorksheetInstanceSectionDto[] | null;
  reassignments?:
    DomainEntitiesQcWorksheetsWorksheetInstanceReassignmentDto[] | null;
  correctionReturns?:
    DomainEntitiesQcWorksheetsWorksheetInstanceCorrectionReturnDto[] | null;
  oosCases?: DomainEntitiesQcWorksheetsWorksheetInstanceOosCaseDto[] | null;
};
export type DomainEntitiesQcWorksheetsWorksheetQueueItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  testRequestSubjectId?: string;
  worksheetTemplateId?: string;
  worksheetTemplateVersion?: number;
  worksheetTemplateCode?: string | null;
  worksheetTemplateName?: string | null;
  analysisType?: DomainEntitiesQcWorksheetsSpecificationAnalysisType;
  assignedToId?: string | null;
  assignedTo?: DomainEntitiesUsersUserDto;
  assignedById?: string | null;
  assignedAt?: string | null;
  status?: DomainEntitiesQcWorksheetsWorksheetInstanceStatus;
  approved?: boolean;
  submittedAt?: string | null;
  retestOfInstanceId?: string | null;
  testRequestId?: string;
  testRequestType?: DomainEntitiesQcWorksheetsTestRequestType;
  testRequestArNumber?: string | null;
  subjectRef?: string | null;
  subjectLabel?: string | null;
  subjectArNumber?: string | null;
  collectedAt?: string | null;
  specificationCode?: string | null;
  specificationVersion?: number;
  hasOpenOosCase?: boolean;
  oosCaseId?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetQueueDto = {
  pendingCount?: number;
  inProgressCount?: number;
  awaitingReviewCount?: number;
  items?: DomainEntitiesQcWorksheetsWorksheetQueueItemDto[] | null;
};
export type DomainEntitiesQcWorksheetsAssignWorksheetInstanceRequest = {
  assignedToId: string;
};
export type DomainEntitiesQcWorksheetsReassignWorksheetInstanceRequest = {
  assignedToId: string;
  reason: string;
};
export type DomainEntitiesQcWorksheetsWorksheetFieldValueEntry = {
  fieldKey: string;
  rowIndex?: number | null;
  columnKey?: string | null;
  value?: string | null;
};
export type DomainEntitiesQcWorksheetsSaveWorksheetValuesRequest = {
  fieldValues: DomainEntitiesQcWorksheetsWorksheetFieldValueEntry[];
};
export type DomainEntitiesQcWorksheetsReviewWorksheetInstanceRequest = {
  approve: boolean;
  password: string;
  comments?: string | null;
};
export type DomainEntitiesQcWorksheetsReturnWorksheetForCorrectionRequest = {
  reason: string;
};
export type DomainEntitiesQcWorksheetsWorksheetTemplateSummaryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  department?: string | null;
  category?: DomainEntitiesQcWorksheetsWorksheetCategory;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  approved?: boolean;
  effectiveDate?: string | null;
  supersedesId?: string | null;
  stpId?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQcWorksheetsWorksheetTemplateSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQcWorksheetsWorksheetTemplateSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQcWorksheetsWorksheetFieldRevisionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  revisionNumber?: number;
  fieldKey?: string | null;
  label?: string | null;
  type?: DomainEntitiesQcWorksheetsWorksheetFieldType;
  mode?: DomainEntitiesQcWorksheetsWorksheetFieldMode;
  unit?: string | null;
  analyte?: string | null;
  constantValue?: string | null;
  formulaExpression?: string | null;
  columnDefinitions?: string | null;
  optionsJson?: string | null;
  order?: number;
};
export type DomainEntitiesQcWorksheetsWorksheetFieldDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  order?: number;
  fieldKey?: string | null;
  label?: string | null;
  type?: DomainEntitiesQcWorksheetsWorksheetFieldType;
  mode?: DomainEntitiesQcWorksheetsWorksheetFieldMode;
  unit?: string | null;
  analyte?: string | null;
  constantValue?: string | null;
  formulaExpression?: string | null;
  columnDefinitions?: string | null;
  optionsJson?: string | null;
  referencedResultSourceTemplateId?: string | null;
  referencedResultSourceFieldKey?: string | null;
  referencedResultResolutionFieldKey?: string | null;
  revisions?: DomainEntitiesQcWorksheetsWorksheetFieldRevisionDto[] | null;
};
export type DomainEntitiesQcWorksheetsWorksheetSectionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  order?: number;
  name?: string | null;
  instrumentId?: string | null;
  fields?: DomainEntitiesQcWorksheetsWorksheetFieldDto[] | null;
};
export type DomainEntitiesQcWorksheetsWorksheetTemplateDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  department?: string | null;
  category?: DomainEntitiesQcWorksheetsWorksheetCategory;
  version?: number;
  status?: DomainEntitiesQcWorksheetsQcDocumentStatus;
  approved?: boolean;
  effectiveDate?: string | null;
  supersedesId?: string | null;
  stpId?: string | null;
  stp?: DomainEntitiesQcWorksheetsStpReferenceDto;
  sections?: DomainEntitiesQcWorksheetsWorksheetSectionDto[] | null;
};
export type DomainEntitiesQcWorksheetsCreateWorksheetFieldRequest = {
  order?: number;
  fieldKey: string;
  label: string;
  type?: DomainEntitiesQcWorksheetsWorksheetFieldType;
  mode?: DomainEntitiesQcWorksheetsWorksheetFieldMode;
  unit?: string | null;
  analyte?: string | null;
  constantValue?: string | null;
  formulaExpression?: string | null;
  columnDefinitions?: string | null;
  optionsJson?: string | null;
  referencedResultSourceTemplateId?: string | null;
  referencedResultSourceFieldKey?: string | null;
  referencedResultResolutionFieldKey?: string | null;
};
export type DomainEntitiesQcWorksheetsCreateWorksheetSectionRequest = {
  order?: number;
  name: string;
  instrumentId?: string | null;
  fields?: DomainEntitiesQcWorksheetsCreateWorksheetFieldRequest[] | null;
};
export type DomainEntitiesQcWorksheetsCreateWorksheetTemplateRequest = {
  code: string;
  name: string;
  department?: string | null;
  stpId?: string | null;
  category?: DomainEntitiesQcWorksheetsWorksheetCategory;
  sections?: DomainEntitiesQcWorksheetsCreateWorksheetSectionRequest[] | null;
};
export type DomainEntitiesQcWorksheetsUpdateWorksheetTemplateRequest = {
  code: string;
  name: string;
  department?: string | null;
  stpId?: string | null;
  category?: DomainEntitiesQcWorksheetsWorksheetCategory;
  sections?: DomainEntitiesQcWorksheetsCreateWorksheetSectionRequest[] | null;
};
export type DomainEntitiesQcWorksheetsMediumIdentity = {
  name?: string | null;
  nameKey?: string | null;
  code?: string | null;
  codeKey?: string | null;
};
export type DomainEntitiesQcWorksheetsSharedTemplateReference = {
  key?: string | null;
  carriedBy?: string | null;
  existingTemplateId?: string | null;
  existingTemplateCode?: string | null;
};
export type DomainEntitiesQcWorksheetsRawMaterialPairingStatus = 0 | 1 | 2;
export type DomainEntitiesQcWorksheetsRawMaterialDocumentInfo = {
  pairingKey?: string | null;
  templateCode?: string | null;
  materialName?: string | null;
  specificationCode?: string | null;
  revision?: string | null;
  pairing?: DomainEntitiesQcWorksheetsRawMaterialPairingStatus;
  pairedFileName?: string | null;
  pairedTemplateId?: string | null;
  pairedTemplateCode?: string | null;
};
export type DomainEntitiesQcWorksheetsProposedWorksheetField = {
  order?: number;
  fieldKey?: string | null;
  label?: string | null;
  type?: DomainEntitiesQcWorksheetsWorksheetFieldType;
  mode?: DomainEntitiesQcWorksheetsWorksheetFieldMode;
  unit?: string | null;
  analyte?: string | null;
  constantValue?: string | null;
  formulaExpression?: string | null;
  columnDefinitions?: string | null;
  options?: string[] | null;
  referencedResultSourceTemplateId?: string | null;
  referencedResultSourceFieldKey?: string | null;
  referencedResultResolutionFieldKey?: string | null;
};
export type DomainEntitiesQcWorksheetsProposedWorksheetSection = {
  order?: number;
  name?: string | null;
  instrumentId?: string | null;
  testDefinition?: string | null;
  testDefinitionVariants?: string[] | null;
  fields?: DomainEntitiesQcWorksheetsProposedWorksheetField[] | null;
};
export type DomainEntitiesQcWorksheetsProposedWorksheetTemplate = {
  code?: string | null;
  name?: string | null;
  department?: string | null;
  category?: DomainEntitiesQcWorksheetsWorksheetCategory;
  sections?: DomainEntitiesQcWorksheetsProposedWorksheetSection[] | null;
};
export type DomainEntitiesQcWorksheetsSamplingPointProposal = {
  code?: string | null;
  name?: string | null;
  area?: string | null;
  type?: DomainEntitiesQcWorksheetsSamplingPointType;
  groupName?: string | null;
  location?: DomainEntitiesQcWorksheetsImportSourceLocation;
};
export type DomainEntitiesQcWorksheetsImportEquipmentMatch = {
  fieldKey?: string | null;
  printedName?: string | null;
  printedCode?: string | null;
  equipmentId?: string | null;
  matchedName?: string | null;
};
export type DomainEntitiesQcWorksheetsImportReagentMatch = {
  fieldKey?: string | null;
  printedName?: string | null;
  reagentId?: string | null;
  matchedName?: string | null;
};
export type DomainEntitiesQcWorksheetsWorksheetImportFlag = {
  code?: string | null;
  message?: string | null;
  location?: DomainEntitiesQcWorksheetsImportSourceLocation;
};
export type DomainEntitiesQcWorksheetsImportFieldProvenance = {
  fieldKey?: string | null;
  columnKey?: string | null;
  location?: DomainEntitiesQcWorksheetsImportSourceLocation;
  confidence?: DomainEntitiesQcWorksheetsImportConfidence;
  reason?: string | null;
};
export type DomainEntitiesQcWorksheetsImportSourceBlock = {
  index?: number;
  kind?: string | null;
  text?: string | null;
  table?: number | null;
  rows?: string[][] | null;
};
export type DomainEntitiesQcWorksheetsImportSourceDocument = {
  headerText?: string | null;
  blocks?: DomainEntitiesQcWorksheetsImportSourceBlock[] | null;
};
export type DomainEntitiesQcWorksheetsWorksheetImportProposal = {
  fileName?: string | null;
  family?: DomainEntitiesQcWorksheetsArdFamily;
  formatVersion?: string | null;
  medium?: DomainEntitiesQcWorksheetsMediumIdentity;
  sharedTemplate?: DomainEntitiesQcWorksheetsSharedTemplateReference;
  rawMaterial?: DomainEntitiesQcWorksheetsRawMaterialDocumentInfo;
  template?: DomainEntitiesQcWorksheetsProposedWorksheetTemplate;
  samplingPointProposals?:
    DomainEntitiesQcWorksheetsSamplingPointProposal[] | null;
  samplingPointGroupProposals?:
    DomainEntitiesQcWorksheetsSamplingPointGroupProposal[] | null;
  specificationProposals?:
    DomainEntitiesQcWorksheetsSpecificationCharacteristicProposal[] | null;
  equipmentMatches?: DomainEntitiesQcWorksheetsImportEquipmentMatch[] | null;
  reagentMatches?: DomainEntitiesQcWorksheetsImportReagentMatch[] | null;
  flags?: DomainEntitiesQcWorksheetsWorksheetImportFlag[] | null;
  fieldProvenance?: DomainEntitiesQcWorksheetsImportFieldProvenance[] | null;
  source?: DomainEntitiesQcWorksheetsImportSourceDocument;
};
export type DomainEntitiesQualityRoutinesEligibleWaterCertificateDto = {
  id?: string;
  certificateCode?: string | null;
  samplingPoint?: string | null;
  issuedAt?: string;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQualityRoutinesEligibleWaterCertificateDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQualityRoutinesEligibleWaterCertificateDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export const {
  useGetApiV1QcInstrumentsQuery,
  useLazyGetApiV1QcInstrumentsQuery,
  useGetApiV1QcInstrumentsByIdQuery,
  useLazyGetApiV1QcInstrumentsByIdQuery,
  usePutApiV1QcInstrumentsByIdCalibrationMutation,
  useGetApiV1QcInstrumentsCalibrationDueQuery,
  useLazyGetApiV1QcInstrumentsCalibrationDueQuery,
  useGetApiV1QcAiExtractionSettingsQuery,
  useLazyGetApiV1QcAiExtractionSettingsQuery,
  usePutApiV1QcAiExtractionSettingsByProviderKeyMutation,
  usePutApiV1QcAiExtractionSettingsActiveMutation,
  useGetApiV1QcWorksheetsCertificatesQuery,
  useLazyGetApiV1QcWorksheetsCertificatesQuery,
  useGetApiV1QcWorksheetsCertificatesByIdQuery,
  useLazyGetApiV1QcWorksheetsCertificatesByIdQuery,
  usePostApiV1QcWorksheetsCertificatesByIdIssueMutation,
  usePostApiV1QcWorksheetsCertificatesByIdReviseMutation,
  usePostApiV1QcEquipmentMutation,
  useGetApiV1QcEquipmentQuery,
  useLazyGetApiV1QcEquipmentQuery,
  useGetApiV1QcEquipmentAllQuery,
  useLazyGetApiV1QcEquipmentAllQuery,
  useGetApiV1QcEquipmentByIdQuery,
  useLazyGetApiV1QcEquipmentByIdQuery,
  usePutApiV1QcEquipmentByIdMutation,
  useDeleteApiV1QcEquipmentByIdMutation,
  useGetApiV1QcEquipmentCalibrationDueQuery,
  useLazyGetApiV1QcEquipmentCalibrationDueQuery,
  useGetApiV1QcWorksheetsMonitoringProgramsSamplingPointsQuery,
  useLazyGetApiV1QcWorksheetsMonitoringProgramsSamplingPointsQuery,
  usePostApiV1QcWorksheetsMonitoringProgramsSamplingPointsMutation,
  useGetApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdQuery,
  useLazyGetApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdQuery,
  usePutApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdMutation,
  useDeleteApiV1QcWorksheetsMonitoringProgramsSamplingPointsByIdMutation,
  useGetApiV1QcWorksheetsMonitoringProgramsQuery,
  useLazyGetApiV1QcWorksheetsMonitoringProgramsQuery,
  usePostApiV1QcWorksheetsMonitoringProgramsMutation,
  useGetApiV1QcWorksheetsMonitoringProgramsByIdQuery,
  useLazyGetApiV1QcWorksheetsMonitoringProgramsByIdQuery,
  usePutApiV1QcWorksheetsMonitoringProgramsByIdMutation,
  usePostApiV1QcWorksheetsMonitoringProgramsByIdPauseMutation,
  usePostApiV1QcWorksheetsMonitoringProgramsByIdResumeMutation,
  usePostApiV1QcWorksheetsMonitoringProgramsScanMutation,
  useGetApiV1QcWorksheetsOosCasesQuery,
  useLazyGetApiV1QcWorksheetsOosCasesQuery,
  useGetApiV1QcWorksheetsOosCasesByIdQuery,
  useLazyGetApiV1QcWorksheetsOosCasesByIdQuery,
  usePostApiV1QcWorksheetsOosCasesByIdStartInvestigationMutation,
  usePutApiV1QcWorksheetsOosCasesByIdInvestigationMutation,
  usePostApiV1QcWorksheetsOosCasesByIdAuthorizeRetestMutation,
  usePostApiV1QcWorksheetsOosCasesByIdEscalateMutation,
  usePostApiV1QcWorksheetsOosCasesByIdDispositionMutation,
  useGetApiV1QcWorksheetsSamplingPointGroupsQuery,
  useLazyGetApiV1QcWorksheetsSamplingPointGroupsQuery,
  usePostApiV1QcWorksheetsSamplingPointGroupsMutation,
  useGetApiV1QcWorksheetsSamplingPointGroupsByIdQuery,
  useLazyGetApiV1QcWorksheetsSamplingPointGroupsByIdQuery,
  usePutApiV1QcWorksheetsSamplingPointGroupsByIdMutation,
  useDeleteApiV1QcWorksheetsSamplingPointGroupsByIdMutation,
  useGetApiV1QcWorksheetsSpecificationsQuery,
  useLazyGetApiV1QcWorksheetsSpecificationsQuery,
  usePostApiV1QcWorksheetsSpecificationsMutation,
  useGetApiV1QcWorksheetsSpecificationsByIdQuery,
  useLazyGetApiV1QcWorksheetsSpecificationsByIdQuery,
  usePutApiV1QcWorksheetsSpecificationsByIdMutation,
  useGetApiV1QcWorksheetsSpecificationsByIdAvailableFieldsQuery,
  useLazyGetApiV1QcWorksheetsSpecificationsByIdAvailableFieldsQuery,
  usePostApiV1QcWorksheetsSpecificationsByIdCreateNewVersionMutation,
  usePostApiV1QcWorksheetsSpecificationsByIdSubmitForReviewMutation,
  usePostApiV1QcWorksheetsSpecificationsByIdApproveMutation,
  usePostApiV1QcWorksheetsSpecificationsByIdRejectMutation,
  usePostApiV1QcWorksheetsSpecificationsByIdMakeEffectiveMutation,
  usePostApiV1QcWorksheetsSpecificationsByIdSupersedeMutation,
  usePostApiV1QcSpecificationProposalsMutation,
  useGetApiV1QcSpecificationProposalsQuery,
  useLazyGetApiV1QcSpecificationProposalsQuery,
  useGetApiV1QcSpecificationProposalsByIdQuery,
  useLazyGetApiV1QcSpecificationProposalsByIdQuery,
  usePostApiV1QcSpecificationProposalsDraftMutation,
  usePostApiV1QcSpecificationProposalsApplyMutation,
  usePostApiV1QcSpecificationProposalsByIdDismissMutation,
  useGetApiV1QcWorksheetsStpsQuery,
  useLazyGetApiV1QcWorksheetsStpsQuery,
  usePostApiV1QcWorksheetsStpsMutation,
  useGetApiV1QcWorksheetsStpsByIdQuery,
  useLazyGetApiV1QcWorksheetsStpsByIdQuery,
  usePutApiV1QcWorksheetsStpsByIdMutation,
  usePostApiV1QcWorksheetsStpsByIdCreateNewVersionMutation,
  usePostApiV1QcWorksheetsStpsByIdSubmitForReviewMutation,
  usePostApiV1QcWorksheetsStpsByIdApproveMutation,
  usePostApiV1QcWorksheetsStpsByIdRejectMutation,
  usePostApiV1QcWorksheetsStpsByIdMakeEffectiveMutation,
  usePostApiV1QcWorksheetsStpsByIdSupersedeMutation,
  usePostApiV1QcWorksheetsStpsImportMutation,
  useGetApiV1QcWorksheetsTestRequestsQuery,
  useLazyGetApiV1QcWorksheetsTestRequestsQuery,
  usePostApiV1QcWorksheetsTestRequestsMutation,
  useGetApiV1QcWorksheetsTestRequestsByIdQuery,
  useLazyGetApiV1QcWorksheetsTestRequestsByIdQuery,
  usePostApiV1QcWorksheetsTestRequestsByIdSubjectsMutation,
  usePostApiV1QcWorksheetsTestRequestsByIdRecordSampleMutation,
  useGetApiV1QcWorksheetsWaterQualityPeriodsQuery,
  useLazyGetApiV1QcWorksheetsWaterQualityPeriodsQuery,
  useGetApiV1QcWorksheetsWaterQualityPeriodsByIdQuery,
  useLazyGetApiV1QcWorksheetsWaterQualityPeriodsByIdQuery,
  usePostApiV1QcWorksheetsWaterQualityPeriodsByIdActivateMutation,
  usePostApiV1QcWorksheetsWaterQualityPeriodsByIdHoldMutation,
  usePostApiV1QcWorksheetsWaterQualityUsesMutation,
  useGetApiV1QcWorksheetsApprovalsMyPendingQuery,
  useLazyGetApiV1QcWorksheetsApprovalsMyPendingQuery,
  useGetApiV1QcWorksheetsApprovalsByEntityTypeAndEntityIdQuery,
  useLazyGetApiV1QcWorksheetsApprovalsByEntityTypeAndEntityIdQuery,
  useGetApiV1QcWorksheetsInstancesByIdQuery,
  useLazyGetApiV1QcWorksheetsInstancesByIdQuery,
  useGetApiV1QcWorksheetsInstancesMyWorkQuery,
  useLazyGetApiV1QcWorksheetsInstancesMyWorkQuery,
  useGetApiV1QcWorksheetsInstancesAwaitingReviewQuery,
  useLazyGetApiV1QcWorksheetsInstancesAwaitingReviewQuery,
  usePostApiV1QcWorksheetsInstancesByIdAssignMutation,
  usePostApiV1QcWorksheetsInstancesByIdReassignMutation,
  usePostApiV1QcWorksheetsInstancesByIdStartMutation,
  usePutApiV1QcWorksheetsInstancesByIdValuesMutation,
  usePostApiV1QcWorksheetsInstancesByIdSubmitMutation,
  usePostApiV1QcWorksheetsInstancesByIdReviewMutation,
  usePostApiV1QcWorksheetsInstancesByIdReturnForCorrectionMutation,
  useGetApiV1QcWorksheetsTemplatesQuery,
  useLazyGetApiV1QcWorksheetsTemplatesQuery,
  usePostApiV1QcWorksheetsTemplatesMutation,
  useGetApiV1QcWorksheetsTemplatesByIdQuery,
  useLazyGetApiV1QcWorksheetsTemplatesByIdQuery,
  usePutApiV1QcWorksheetsTemplatesByIdMutation,
  usePostApiV1QcWorksheetsTemplatesByIdCreateNewVersionMutation,
  usePostApiV1QcWorksheetsTemplatesByIdSubmitForReviewMutation,
  usePostApiV1QcWorksheetsTemplatesByIdApproveMutation,
  usePostApiV1QcWorksheetsTemplatesByIdRejectMutation,
  usePostApiV1QcWorksheetsTemplatesByIdMakeEffectiveMutation,
  usePostApiV1QcWorksheetsTemplatesByIdSupersedeMutation,
  usePostApiV1QcWorksheetsTemplatesImportMutation,
  useGetApiV1QcWaterQualityCertificatesQuery,
  useLazyGetApiV1QcWaterQualityCertificatesQuery,
} = injectedRtkApi;
