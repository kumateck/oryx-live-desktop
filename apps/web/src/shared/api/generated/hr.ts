import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiV1AttendanceRecordsDailySummary: build.query<
      GetApiV1AttendanceRecordsDailySummaryApiResponse,
      GetApiV1AttendanceRecordsDailySummaryApiArg
    >({
      providesTags: [{ type: "attendance-record/daily-summary", id: "LIST" }, { type: "attendance-record", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/attendance-records/daily-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentName: queryArg.departmentName,
          date: queryArg.date,
        },
      }),
    }),
    getApiV1AttendanceRecordsGeneralSummary: build.query<
      GetApiV1AttendanceRecordsGeneralSummaryApiResponse,
      GetApiV1AttendanceRecordsGeneralSummaryApiArg
    >({
      providesTags: [{ type: "attendance-record/general-summary", id: "LIST" }, { type: "attendance-record", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/attendance-records/general-summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          asOfDate: queryArg.asOfDate,
        },
      }),
    }),
    postApiV1Designation: build.mutation<
      PostApiV1DesignationApiResponse,
      PostApiV1DesignationApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "designation", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/designation`,
        method: "POST",
        body: queryArg.domainEntitiesDesignationsCreateDesignationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Designation: build.query<
      GetApiV1DesignationApiResponse,
      GetApiV1DesignationApiArg
    >({
      providesTags: [{ type: "designation", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/designation`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1DesignationById: build.query<
      GetApiV1DesignationByIdApiResponse,
      GetApiV1DesignationByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "designation", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/designation/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1DesignationById: build.mutation<
      PutApiV1DesignationByIdApiResponse,
      PutApiV1DesignationByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "designation", id: "LIST" }, { type: "designation", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/designation/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesDesignationsCreateDesignationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1DesignationById: build.mutation<
      DeleteApiV1DesignationByIdApiResponse,
      DeleteApiV1DesignationByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "designation", id: "LIST" }, { type: "designation", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/designation/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1DesignationDepartmentById: build.query<
      GetApiV1DesignationDepartmentByIdApiResponse,
      GetApiV1DesignationDepartmentByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "designation/department", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/designation/department/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1EmployeeRegister: build.mutation<
      PostApiV1EmployeeRegisterApiResponse,
      PostApiV1EmployeeRegisterApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "employee/register", id: "LIST" }, { type: "employee", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/register`,
        method: "POST",
        body: queryArg.domainEntitiesEmployeesOnboardEmployeeDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Employee: build.mutation<
      PostApiV1EmployeeApiResponse,
      PostApiV1EmployeeApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "employee", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/employee`,
        method: "POST",
        body: queryArg.domainEntitiesEmployeesCreateEmployeeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Employee: build.query<
      GetApiV1EmployeeApiResponse,
      GetApiV1EmployeeApiArg
    >({
      providesTags: [{ type: "employee", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/employee`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          status: queryArg.status,
          searchQuery: queryArg.searchQuery,
          designation: queryArg.designation,
          department: queryArg.department,
          isNotUser: queryArg.isNotUser,
          sortBy: queryArg.sortBy,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    postApiV1EmployeeUser: build.mutation<
      PostApiV1EmployeeUserApiResponse,
      PostApiV1EmployeeUserApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "employee/user", id: "LIST" }, { type: "employee", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/user`,
        method: "POST",
        body: queryArg.domainEntitiesEmployeesEmployeeUserDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1EmployeeAvatarById: build.mutation<
      PostApiV1EmployeeAvatarByIdApiResponse,
      PostApiV1EmployeeAvatarByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee/avatar", id: "LIST" }, { type: "employee", id: "LIST" }, { type: "employee/avatar", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/avatar/${queryArg.id}`,
        method: "POST",
        body: queryArg.sharedRequestsUploadFileRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1EmployeeDepartmentsById: build.query<
      GetApiV1EmployeeDepartmentsByIdApiResponse,
      GetApiV1EmployeeDepartmentsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "employee/department", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/employee/departments/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1EmployeeByShiftScheduleIdAvailable: build.query<
      GetApiV1EmployeeByShiftScheduleIdAvailableApiResponse,
      GetApiV1EmployeeByShiftScheduleIdAvailableApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "employee", id: queryArg.shiftScheduleId }],
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.shiftScheduleId}/available`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          date: queryArg.date,
        },
      }),
    }),
    getApiV1EmployeeById: build.query<
      GetApiV1EmployeeByIdApiResponse,
      GetApiV1EmployeeByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "employee", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1EmployeeById: build.mutation<
      PutApiV1EmployeeByIdApiResponse,
      PutApiV1EmployeeByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee", id: "LIST" }, { type: "employee", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesEmployeesUpdateEmployeeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1EmployeeById: build.mutation<
      DeleteApiV1EmployeeByIdApiResponse,
      DeleteApiV1EmployeeByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee", id: "LIST" }, { type: "employee", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1EmployeeByIdAssign: build.mutation<
      PutApiV1EmployeeByIdAssignApiResponse,
      PutApiV1EmployeeByIdAssignApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee", id: "LIST" }, { type: "employee", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.id}/assign`,
        method: "PUT",
        body: queryArg.domainEntitiesEmployeesAssignEmployeeDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1EmployeeByIdChangeType: build.mutation<
      PutApiV1EmployeeByIdChangeTypeApiResponse,
      PutApiV1EmployeeByIdChangeTypeApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee", id: "LIST" }, { type: "employee", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.id}/change-type`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          employeeType: queryArg.employeeType,
        },
      }),
    }),
    putApiV1EmployeeByIdStatus: build.mutation<
      PutApiV1EmployeeByIdStatusApiResponse,
      PutApiV1EmployeeByIdStatusApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee", id: "LIST" }, { type: "employee", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/${queryArg.id}/status`,
        method: "PUT",
        body: queryArg.domainEntitiesEmployeesUpdateEmployeeStatus,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1EmployeeEmailById: build.mutation<
      PutApiV1EmployeeEmailByIdApiResponse,
      PutApiV1EmployeeEmailByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "employee/email", id: "LIST" }, { type: "employee", id: "LIST" }, { type: "employee/email", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/employee/email/${queryArg.id}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          email: queryArg.email,
        },
      }),
    }),
    getApiV1EmployeeMe: build.query<
      GetApiV1EmployeeMeApiResponse,
      GetApiV1EmployeeMeApiArg
    >({
      providesTags: [{ type: "employee/me", id: "LIST" }, { type: "employee", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/employee/me`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1LeaveEntitlement: build.mutation<
      PostApiV1LeaveEntitlementApiResponse,
      PostApiV1LeaveEntitlementApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "leave-entitlement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-entitlement`,
        method: "POST",
        body: queryArg.domainEntitiesLeaveEntitlementsLeaveEntitlementDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1LeaveEntitlement: build.query<
      GetApiV1LeaveEntitlementApiResponse,
      GetApiV1LeaveEntitlementApiArg
    >({
      providesTags: [{ type: "leave-entitlement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/leave-entitlement`,
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
    getApiV1LeaveEntitlementById: build.query<
      GetApiV1LeaveEntitlementByIdApiResponse,
      GetApiV1LeaveEntitlementByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "leave-entitlement", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/leave-entitlement/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1LeaveEntitlementById: build.mutation<
      PutApiV1LeaveEntitlementByIdApiResponse,
      PutApiV1LeaveEntitlementByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-entitlement", id: "LIST" }, { type: "leave-entitlement", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-entitlement/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesLeaveEntitlementsLeaveEntitlementDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1LeaveEntitlementById: build.mutation<
      DeleteApiV1LeaveEntitlementByIdApiResponse,
      DeleteApiV1LeaveEntitlementByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-entitlement", id: "LIST" }, { type: "leave-entitlement", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-entitlement/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1LeaveRequest: build.mutation<
      PostApiV1LeaveRequestApiResponse,
      PostApiV1LeaveRequestApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "leave-request", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-request`,
        method: "POST",
        body: queryArg.domainEntitiesLeaveRequestsCreateLeaveRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1LeaveRequest: build.query<
      GetApiV1LeaveRequestApiResponse,
      GetApiV1LeaveRequestApiArg
    >({
      providesTags: [{ type: "leave-request", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/leave-request`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          leaveCategory: queryArg.leaveCategory,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1LeaveRequestById: build.query<
      GetApiV1LeaveRequestByIdApiResponse,
      GetApiV1LeaveRequestByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "leave-request", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/leave-request/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1LeaveRequestById: build.mutation<
      PutApiV1LeaveRequestByIdApiResponse,
      PutApiV1LeaveRequestByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-request", id: "LIST" }, { type: "leave-request", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-request/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesLeaveRequestsCreateLeaveRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1LeaveRequestById: build.mutation<
      DeleteApiV1LeaveRequestByIdApiResponse,
      DeleteApiV1LeaveRequestByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-request", id: "LIST" }, { type: "leave-request", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-request/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1LeaveRequestRecall: build.mutation<
      PutApiV1LeaveRequestRecallApiResponse,
      PutApiV1LeaveRequestRecallApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "leave-request/recall", id: "LIST" }, { type: "leave-request", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-request/recall`,
        method: "PUT",
        body: queryArg.domainEntitiesLeaveRequestsCreateLeaveRecallRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1LeaveRequestByLeaveRequestIdReapply: build.mutation<
      PutApiV1LeaveRequestByLeaveRequestIdReapplyApiResponse,
      PutApiV1LeaveRequestByLeaveRequestIdReapplyApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-request", id: "LIST" }, { type: "leave-request", id: queryArg.leaveRequestId }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-request/${queryArg.leaveRequestId}/reapply`,
        method: "PUT",
        body: queryArg.domainEntitiesLeaveRequestsReapplyLeaveRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1LeaveRequestByIdCancel: build.mutation<
      PostApiV1LeaveRequestByIdCancelApiResponse,
      PostApiV1LeaveRequestByIdCancelApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-request", id: "LIST" }, { type: "leave-request", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-request/${queryArg.id}/cancel`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1LeaveType: build.mutation<
      PostApiV1LeaveTypeApiResponse,
      PostApiV1LeaveTypeApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "leave-type", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-type`,
        method: "POST",
        body: queryArg.domainEntitiesLeaveTypesCreateLeaveTypeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1LeaveType: build.query<
      GetApiV1LeaveTypeApiResponse,
      GetApiV1LeaveTypeApiArg
    >({
      providesTags: [{ type: "leave-type", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/leave-type`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          designationId: queryArg.designationId,
        },
      }),
    }),
    getApiV1LeaveTypeById: build.query<
      GetApiV1LeaveTypeByIdApiResponse,
      GetApiV1LeaveTypeByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "leave-type", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/leave-type/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1LeaveTypeById: build.mutation<
      PutApiV1LeaveTypeByIdApiResponse,
      PutApiV1LeaveTypeByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-type", id: "LIST" }, { type: "leave-type", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-type/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesLeaveTypesCreateLeaveTypeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1LeaveTypeById: build.mutation<
      DeleteApiV1LeaveTypeByIdApiResponse,
      DeleteApiV1LeaveTypeByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "leave-type", id: "LIST" }, { type: "leave-type", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/leave-type/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1OnboardingInvitation: build.mutation<
      PostApiV1OnboardingInvitationApiResponse,
      PostApiV1OnboardingInvitationApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "onboarding/invitation", id: "LIST" }, { type: "onboarding", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/onboarding/invitation`,
        method: "POST",
        body: queryArg.domainEntitiesEmployeesOnboardingTokenRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1OnboardingSubmit: build.mutation<
      PostApiV1OnboardingSubmitApiResponse,
      PostApiV1OnboardingSubmitApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "onboarding/submit", id: "LIST" }, { type: "onboarding", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/onboarding/submit`,
        method: "POST",
        body: queryArg.domainEntitiesEmployeesCompleteOnboardingRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1OnboardingPhoto: build.mutation<
      PostApiV1OnboardingPhotoApiResponse,
      PostApiV1OnboardingPhotoApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "onboarding/photo", id: "LIST" }, { type: "onboarding", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/onboarding/photo`,
        method: "POST",
        body: queryArg.domainEntitiesEmployeesOnboardingAvatarRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1OvertimeRequests: build.mutation<
      PostApiV1OvertimeRequestsApiResponse,
      PostApiV1OvertimeRequestsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "overtime-request", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/overtime-requests`,
        method: "POST",
        body: queryArg.domainEntitiesOvertimeRequestsCreateOvertimeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1OvertimeRequests: build.query<
      GetApiV1OvertimeRequestsApiResponse,
      GetApiV1OvertimeRequestsApiArg
    >({
      providesTags: [{ type: "overtime-request", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/overtime-requests`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1OvertimeRequestsById: build.query<
      GetApiV1OvertimeRequestsByIdApiResponse,
      GetApiV1OvertimeRequestsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "overtime-request", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/overtime-requests/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1OvertimeRequestsById: build.mutation<
      PutApiV1OvertimeRequestsByIdApiResponse,
      PutApiV1OvertimeRequestsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "overtime-request", id: "LIST" }, { type: "overtime-request", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/overtime-requests/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesOvertimeRequestsCreateOvertimeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1OvertimeRequestsById: build.mutation<
      DeleteApiV1OvertimeRequestsByIdApiResponse,
      DeleteApiV1OvertimeRequestsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "overtime-request", id: "LIST" }, { type: "overtime-request", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/overtime-requests/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1PerformanceGoals: build.mutation<
      PostApiV1PerformanceGoalsApiResponse,
      PostApiV1PerformanceGoalsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "performance/goal", id: "LIST" }, { type: "performance", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/performance/goals`,
        method: "POST",
        body: queryArg.domainEntitiesPerformanceCreateGoalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1PerformanceGoalsById: build.mutation<
      PutApiV1PerformanceGoalsByIdApiResponse,
      PutApiV1PerformanceGoalsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "performance/goal", id: "LIST" }, { type: "performance", id: "LIST" }, { type: "performance/goal", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/performance/goals/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesPerformanceUpdateGoalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1PerformanceGoalsById: build.mutation<
      DeleteApiV1PerformanceGoalsByIdApiResponse,
      DeleteApiV1PerformanceGoalsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "performance/goal", id: "LIST" }, { type: "performance", id: "LIST" }, { type: "performance/goal", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/performance/goals/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ShiftCategory: build.mutation<
      PostApiV1ShiftCategoryApiResponse,
      PostApiV1ShiftCategoryApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "shift-category", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-category`,
        method: "POST",
        body: queryArg.domainEntitiesShiftAssignmentsCreateShiftCategoryRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ShiftCategory: build.query<
      GetApiV1ShiftCategoryApiResponse,
      GetApiV1ShiftCategoryApiArg
    >({
      providesTags: [{ type: "shift-category", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/shift-category`,
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
    getApiV1ShiftCategoryById: build.query<
      GetApiV1ShiftCategoryByIdApiResponse,
      GetApiV1ShiftCategoryByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "shift-category", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/shift-category/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ShiftCategoryById: build.mutation<
      PutApiV1ShiftCategoryByIdApiResponse,
      PutApiV1ShiftCategoryByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-category", id: "LIST" }, { type: "shift-category", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-category/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesShiftAssignmentsCreateShiftCategoryRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ShiftCategoryById: build.mutation<
      DeleteApiV1ShiftCategoryByIdApiResponse,
      DeleteApiV1ShiftCategoryByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-category", id: "LIST" }, { type: "shift-category", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-category/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ShiftSchedules: build.mutation<
      PostApiV1ShiftSchedulesApiResponse,
      PostApiV1ShiftSchedulesApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "shift-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules`,
        method: "POST",
        body: queryArg.domainEntitiesShiftSchedulesCreateShiftScheduleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ShiftSchedules: build.query<
      GetApiV1ShiftSchedulesApiResponse,
      GetApiV1ShiftSchedulesApiArg
    >({
      providesTags: [{ type: "shift-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          frequency: queryArg.frequency,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1ShiftSchedulesById: build.query<
      GetApiV1ShiftSchedulesByIdApiResponse,
      GetApiV1ShiftSchedulesByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "shift-schedule", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ShiftSchedulesById: build.mutation<
      PutApiV1ShiftSchedulesByIdApiResponse,
      PutApiV1ShiftSchedulesByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-schedule", id: "LIST" }, { type: "shift-schedule", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesShiftSchedulesCreateShiftScheduleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ShiftSchedulesById: build.mutation<
      DeleteApiV1ShiftSchedulesByIdApiResponse,
      DeleteApiV1ShiftSchedulesByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-schedule", id: "LIST" }, { type: "shift-schedule", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ShiftSchedulesDepartmentById: build.query<
      GetApiV1ShiftSchedulesDepartmentByIdApiResponse,
      GetApiV1ShiftSchedulesDepartmentByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "shift-schedule/department", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/department/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ShiftSchedulesByScheduleIdView: build.query<
      GetApiV1ShiftSchedulesByScheduleIdViewApiResponse,
      GetApiV1ShiftSchedulesByScheduleIdViewApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "shift-schedule", id: queryArg.scheduleId }],
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/${queryArg.scheduleId}/view`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ShiftSchedulesByScheduleIdDay: build.query<
      GetApiV1ShiftSchedulesByScheduleIdDayApiResponse,
      GetApiV1ShiftSchedulesByScheduleIdDayApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "shift-schedule", id: queryArg.scheduleId }],
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/${queryArg.scheduleId}/day`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          date: queryArg.date,
        },
      }),
    }),
    putApiV1ShiftSchedulesByIdUpdateSchedule: build.mutation<
      PutApiV1ShiftSchedulesByIdUpdateScheduleApiResponse,
      PutApiV1ShiftSchedulesByIdUpdateScheduleApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-schedule", id: "LIST" }, { type: "shift-schedule", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/${queryArg.id}/update-schedule`,
        method: "PUT",
        body: queryArg.domainEntitiesShiftAssignmentsUpdateShiftAssignment,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ShiftSchedulesAssignImport: build.mutation<
      PostApiV1ShiftSchedulesAssignImportApiResponse,
      PostApiV1ShiftSchedulesAssignImportApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "shift-schedule/assign", id: "LIST" }, { type: "shift-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-schedules/assign/import`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          shiftId: queryArg.shiftId,
        },
      }),
    }),
    postApiV1ShiftType: build.mutation<
      PostApiV1ShiftTypeApiResponse,
      PostApiV1ShiftTypeApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "shift-type", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-type`,
        method: "POST",
        body: queryArg.domainEntitiesShiftTypesCreateShiftTypeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ShiftType: build.query<
      GetApiV1ShiftTypeApiResponse,
      GetApiV1ShiftTypeApiArg
    >({
      providesTags: [{ type: "shift-type", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/shift-type`,
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
    getApiV1ShiftTypeById: build.query<
      GetApiV1ShiftTypeByIdApiResponse,
      GetApiV1ShiftTypeByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "shift-type", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/shift-type/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ShiftTypeById: build.mutation<
      PutApiV1ShiftTypeByIdApiResponse,
      PutApiV1ShiftTypeByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-type", id: "LIST" }, { type: "shift-type", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-type/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesShiftTypesCreateShiftTypeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ShiftTypeById: build.mutation<
      DeleteApiV1ShiftTypeByIdApiResponse,
      DeleteApiV1ShiftTypeByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "shift-type", id: "LIST" }, { type: "shift-type", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/shift-type/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1StaffRequisitions: build.mutation<
      PostApiV1StaffRequisitionsApiResponse,
      PostApiV1StaffRequisitionsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "staff-requisition", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/staff-requisitions`,
        method: "POST",
        body: queryArg.domainEntitiesStaffRequisitionsCreateStaffRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1StaffRequisitions: build.query<
      GetApiV1StaffRequisitionsApiResponse,
      GetApiV1StaffRequisitionsApiArg
    >({
      providesTags: [{ type: "staff-requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/staff-requisitions`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          appointmentType: queryArg.appointmentType,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1StaffRequisitionsById: build.query<
      GetApiV1StaffRequisitionsByIdApiResponse,
      GetApiV1StaffRequisitionsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "staff-requisition", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/staff-requisitions/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1StaffRequisitionsById: build.mutation<
      PutApiV1StaffRequisitionsByIdApiResponse,
      PutApiV1StaffRequisitionsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "staff-requisition", id: "LIST" }, { type: "staff-requisition", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/staff-requisitions/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesStaffRequisitionsCreateStaffRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1StaffRequisitionsById: build.mutation<
      DeleteApiV1StaffRequisitionsByIdApiResponse,
      DeleteApiV1StaffRequisitionsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "staff-requisition", id: "LIST" }, { type: "staff-requisition", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/staff-requisitions/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as hrApi };
export type GetApiV1AttendanceRecordsDailySummaryApiResponse =
  /** status 200 OK */ DomainEntitiesAttendanceRecordsAttendanceRecordDepartmentDto[];
export type GetApiV1AttendanceRecordsDailySummaryApiArg = {
  departmentName?: string;
  date?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1AttendanceRecordsGeneralSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesAttendanceRecordsGeneralAttendanceReportResponseRead;
export type GetApiV1AttendanceRecordsGeneralSummaryApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Recorded historical state at this UTC instant. Today is capped at the current instant; pre-coverage dates return 409. */
  asOfDate?: string | null;
};
export type PostApiV1DesignationApiResponse = /** status 200 OK */ string;
export type PostApiV1DesignationApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesDesignationsCreateDesignationRequest: DomainEntitiesDesignationsCreateDesignationRequest;
};
export type GetApiV1DesignationApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesDesignationsDesignationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1DesignationApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1DesignationByIdApiResponse =
  /** status 200 OK */ DomainEntitiesDesignationsDesignationDto;
export type GetApiV1DesignationByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1DesignationByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesDesignationsDesignationDto;
export type PutApiV1DesignationByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesDesignationsCreateDesignationRequest: DomainEntitiesDesignationsCreateDesignationRequest;
};
export type DeleteApiV1DesignationByIdApiResponse = void;
export type DeleteApiV1DesignationByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1DesignationDepartmentByIdApiResponse =
  /** status 200 OK */ DomainEntitiesDesignationsDesignationDto[];
export type GetApiV1DesignationDepartmentByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1EmployeeRegisterApiResponse =
  /** status 200 OK */ DomainEntitiesEmployeesEmployeeInvitationResult[];
export type PostApiV1EmployeeRegisterApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesOnboardEmployeeDto: DomainEntitiesEmployeesOnboardEmployeeDto;
};
export type PostApiV1EmployeeApiResponse = /** status 200 OK */ string;
export type PostApiV1EmployeeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesCreateEmployeeRequest: DomainEntitiesEmployeesCreateEmployeeRequest;
};
export type GetApiV1EmployeeApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesEmployeesEmployeeDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1EmployeeApiArg = {
  page?: number;
  pageSize?: number;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  searchQuery?: string;
  designation?: string;
  department?: string;
  isNotUser?: boolean;
  sortBy?: DomainEntitiesEmployeesEmployeeSortBy;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1EmployeeUserApiResponse = /** status 200 OK */ string;
export type PostApiV1EmployeeUserApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesEmployeeUserDto: DomainEntitiesEmployeesEmployeeUserDto;
};
export type PostApiV1EmployeeAvatarByIdApiResponse = void;
export type PostApiV1EmployeeAvatarByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  sharedRequestsUploadFileRequest: SharedRequestsUploadFileRequest;
};
export type GetApiV1EmployeeDepartmentsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesEmployeesEmployeeDto[];
export type GetApiV1EmployeeDepartmentsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1EmployeeByShiftScheduleIdAvailableApiResponse =
  /** status 200 OK */ DomainEntitiesEmployeesMinimalEmployeeInfoDto[];
export type GetApiV1EmployeeByShiftScheduleIdAvailableApiArg = {
  shiftScheduleId: string;
  date?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1EmployeeByIdApiResponse =
  /** status 200 OK */ DomainEntitiesEmployeesEmployeeDto;
export type GetApiV1EmployeeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1EmployeeByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesEmployeesEmployeeDto;
export type PutApiV1EmployeeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesUpdateEmployeeRequest: DomainEntitiesEmployeesUpdateEmployeeRequest;
};
export type DeleteApiV1EmployeeByIdApiResponse = void;
export type DeleteApiV1EmployeeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1EmployeeByIdAssignApiResponse =
  /** status 204 No Content */ DomainEntitiesEmployeesEmployeeDto;
export type PutApiV1EmployeeByIdAssignApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesAssignEmployeeDto: DomainEntitiesEmployeesAssignEmployeeDto;
};
export type PutApiV1EmployeeByIdChangeTypeApiResponse =
  /** status 204 No Content */ DomainEntitiesEmployeesEmployeeDto;
export type PutApiV1EmployeeByIdChangeTypeApiArg = {
  id: string;
  employeeType?: DomainEntitiesEmployeesEmployeeType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1EmployeeByIdStatusApiResponse =
  /** status 204 No Content */ DomainEntitiesEmployeesEmployeeDto;
export type PutApiV1EmployeeByIdStatusApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The states of the employee to be chanegd */
  domainEntitiesEmployeesUpdateEmployeeStatus: DomainEntitiesEmployeesUpdateEmployeeStatus;
};
export type PutApiV1EmployeeEmailByIdApiResponse = void;
export type PutApiV1EmployeeEmailByIdApiArg = {
  id: string;
  email?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1EmployeeMeApiResponse =
  /** status 200 OK */ DomainEntitiesEmployeesEmployeeDto;
export type GetApiV1EmployeeMeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1LeaveEntitlementApiResponse = /** status 200 OK */ string;
export type PostApiV1LeaveEntitlementApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveEntitlementsLeaveEntitlementDto: DomainEntitiesLeaveEntitlementsLeaveEntitlementDto;
};
export type GetApiV1LeaveEntitlementApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveEntitlementsLeaveEntitlementDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1LeaveEntitlementApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1LeaveEntitlementByIdApiResponse =
  /** status 200 OK */ DomainEntitiesLeaveEntitlementsLeaveEntitlementDto;
export type GetApiV1LeaveEntitlementByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1LeaveEntitlementByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesLeaveEntitlementsLeaveEntitlementDto;
export type PutApiV1LeaveEntitlementByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveEntitlementsLeaveEntitlementDto: DomainEntitiesLeaveEntitlementsLeaveEntitlementDto;
};
export type DeleteApiV1LeaveEntitlementByIdApiResponse = void;
export type DeleteApiV1LeaveEntitlementByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1LeaveRequestApiResponse = /** status 200 OK */ string;
export type PostApiV1LeaveRequestApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveRequestsCreateLeaveRequest: DomainEntitiesLeaveRequestsCreateLeaveRequest;
};
export type GetApiV1LeaveRequestApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveRequestsLeaveRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1LeaveRequestApiArg = {
  status?: DomainEntitiesLeaveRequestsLeaveStatus;
  leaveCategory?: DomainEntitiesLeaveRequestsRequestCategory;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1LeaveRequestByIdApiResponse =
  /** status 200 OK */ DomainEntitiesLeaveRequestsLeaveRequestDtoRead;
export type GetApiV1LeaveRequestByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1LeaveRequestByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesLeaveRequestsLeaveRequestDtoRead;
export type PutApiV1LeaveRequestByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveRequestsCreateLeaveRequest: DomainEntitiesLeaveRequestsCreateLeaveRequest;
};
export type DeleteApiV1LeaveRequestByIdApiResponse = void;
export type DeleteApiV1LeaveRequestByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1LeaveRequestRecallApiResponse =
  /** status 204 No Content */ DomainEntitiesLeaveRequestsLeaveRequestDtoRead;
export type PutApiV1LeaveRequestRecallApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveRequestsCreateLeaveRecallRequest: DomainEntitiesLeaveRequestsCreateLeaveRecallRequest;
};
export type PutApiV1LeaveRequestByLeaveRequestIdReapplyApiResponse =
  /** status 204 No Content */ DomainEntitiesLeaveRequestsLeaveRequestDtoRead;
export type PutApiV1LeaveRequestByLeaveRequestIdReapplyApiArg = {
  leaveRequestId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveRequestsReapplyLeaveRequest: DomainEntitiesLeaveRequestsReapplyLeaveRequest;
};
export type PostApiV1LeaveRequestByIdCancelApiResponse = void;
export type PostApiV1LeaveRequestByIdCancelApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1LeaveTypeApiResponse = /** status 200 OK */ string;
export type PostApiV1LeaveTypeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveTypesCreateLeaveTypeRequest: DomainEntitiesLeaveTypesCreateLeaveTypeRequest;
};
export type GetApiV1LeaveTypeApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveTypesLeaveTypeDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1LeaveTypeApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  designationId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1LeaveTypeByIdApiResponse =
  /** status 200 OK */ DomainEntitiesLeaveTypesLeaveTypeDto;
export type GetApiV1LeaveTypeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1LeaveTypeByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesLeaveTypesLeaveTypeDto;
export type PutApiV1LeaveTypeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesLeaveTypesCreateLeaveTypeRequest: DomainEntitiesLeaveTypesCreateLeaveTypeRequest;
};
export type DeleteApiV1LeaveTypeByIdApiResponse = void;
export type DeleteApiV1LeaveTypeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1OnboardingInvitationApiResponse =
  /** status 200 OK */ DomainEntitiesEmployeesOnboardingInvitationDto;
export type PostApiV1OnboardingInvitationApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesOnboardingTokenRequest: DomainEntitiesEmployeesOnboardingTokenRequest;
};
export type PostApiV1OnboardingSubmitApiResponse = /** status 200 OK */ string;
export type PostApiV1OnboardingSubmitApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesCompleteOnboardingRequest: DomainEntitiesEmployeesCompleteOnboardingRequest;
};
export type PostApiV1OnboardingPhotoApiResponse = void;
export type PostApiV1OnboardingPhotoApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesEmployeesOnboardingAvatarRequest: DomainEntitiesEmployeesOnboardingAvatarRequest;
};
export type PostApiV1OvertimeRequestsApiResponse = /** status 200 OK */ string;
export type PostApiV1OvertimeRequestsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesOvertimeRequestsCreateOvertimeRequest: DomainEntitiesOvertimeRequestsCreateOvertimeRequest;
};
export type GetApiV1OvertimeRequestsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesOvertimeRequestsOvertimeRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1OvertimeRequestsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesOvertimeRequestsOvertimeStatus;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1OvertimeRequestsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesOvertimeRequestsOvertimeRequestDto;
export type GetApiV1OvertimeRequestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1OvertimeRequestsByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesOvertimeRequestsOvertimeRequestDto;
export type PutApiV1OvertimeRequestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesOvertimeRequestsCreateOvertimeRequest: DomainEntitiesOvertimeRequestsCreateOvertimeRequest;
};
export type DeleteApiV1OvertimeRequestsByIdApiResponse = void;
export type DeleteApiV1OvertimeRequestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1PerformanceGoalsApiResponse = /** status 200 OK */ string;
export type PostApiV1PerformanceGoalsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesPerformanceCreateGoalRequest: DomainEntitiesPerformanceCreateGoalRequest;
};
export type PutApiV1PerformanceGoalsByIdApiResponse = void;
export type PutApiV1PerformanceGoalsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesPerformanceUpdateGoalRequest: DomainEntitiesPerformanceUpdateGoalRequest;
};
export type DeleteApiV1PerformanceGoalsByIdApiResponse = void;
export type DeleteApiV1PerformanceGoalsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ShiftCategoryApiResponse = /** status 200 OK */ string;
export type PostApiV1ShiftCategoryApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftAssignmentsCreateShiftCategoryRequest: DomainEntitiesShiftAssignmentsCreateShiftCategoryRequest;
};
export type GetApiV1ShiftCategoryApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShiftAssignmentsShiftCategoryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ShiftCategoryApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ShiftCategoryByIdApiResponse =
  /** status 200 OK */ DomainEntitiesShiftAssignmentsShiftCategoryDto;
export type GetApiV1ShiftCategoryByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ShiftCategoryByIdApiResponse = void;
export type PutApiV1ShiftCategoryByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftAssignmentsCreateShiftCategoryRequest: DomainEntitiesShiftAssignmentsCreateShiftCategoryRequest;
};
export type DeleteApiV1ShiftCategoryByIdApiResponse = void;
export type DeleteApiV1ShiftCategoryByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ShiftSchedulesApiResponse = /** status 200 OK */ string;
export type PostApiV1ShiftSchedulesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftSchedulesCreateShiftScheduleRequest: DomainEntitiesShiftSchedulesCreateShiftScheduleRequest;
};
export type GetApiV1ShiftSchedulesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShiftSchedulesShiftScheduleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ShiftSchedulesApiArg = {
  status?: DomainEntitiesShiftSchedulesScheduleStatus;
  frequency?: DomainEntitiesShiftSchedulesScheduleFrequency;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ShiftSchedulesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesShiftSchedulesShiftScheduleDto;
export type GetApiV1ShiftSchedulesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ShiftSchedulesByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesShiftSchedulesShiftScheduleDto;
export type PutApiV1ShiftSchedulesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftSchedulesCreateShiftScheduleRequest: DomainEntitiesShiftSchedulesCreateShiftScheduleRequest;
};
export type DeleteApiV1ShiftSchedulesByIdApiResponse = void;
export type DeleteApiV1ShiftSchedulesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ShiftSchedulesDepartmentByIdApiResponse =
  /** status 200 OK */ DomainEntitiesShiftSchedulesShiftScheduleDto[];
export type GetApiV1ShiftSchedulesDepartmentByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ShiftSchedulesByScheduleIdViewApiResponse =
  /** status 200 OK */ DomainEntitiesShiftAssignmentsShiftAssignmentDto[];
export type GetApiV1ShiftSchedulesByScheduleIdViewApiArg = {
  scheduleId: string;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ShiftSchedulesByScheduleIdDayApiResponse =
  /** status 200 OK */ DomainEntitiesShiftAssignmentsShiftAssignmentDto[];
export type GetApiV1ShiftSchedulesByScheduleIdDayApiArg = {
  scheduleId: string;
  date?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ShiftSchedulesByIdUpdateScheduleApiResponse = void;
export type PutApiV1ShiftSchedulesByIdUpdateScheduleApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftAssignmentsUpdateShiftAssignment: DomainEntitiesShiftAssignmentsUpdateShiftAssignment;
};
export type PostApiV1ShiftSchedulesAssignImportApiResponse = void;
export type PostApiV1ShiftSchedulesAssignImportApiArg = {
  /** The department the shift assignment is for */
  departmentId?: string;
  /** The shift schedule */
  shiftId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: {
    file?: Blob;
  };
};
export type PostApiV1ShiftTypeApiResponse = /** status 200 OK */ string;
export type PostApiV1ShiftTypeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftTypesCreateShiftTypeRequest: DomainEntitiesShiftTypesCreateShiftTypeRequest;
};
export type GetApiV1ShiftTypeApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShiftTypesShiftTypeDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ShiftTypeApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ShiftTypeByIdApiResponse =
  /** status 200 OK */ DomainEntitiesShiftTypesShiftTypeDto;
export type GetApiV1ShiftTypeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ShiftTypeByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesShiftTypesShiftTypeDto;
export type PutApiV1ShiftTypeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftTypesCreateShiftTypeRequest: DomainEntitiesShiftTypesCreateShiftTypeRequest;
};
export type DeleteApiV1ShiftTypeByIdApiResponse = void;
export type DeleteApiV1ShiftTypeByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1StaffRequisitionsApiResponse = /** status 200 OK */ string;
export type PostApiV1StaffRequisitionsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesStaffRequisitionsCreateStaffRequisitionRequest: DomainEntitiesStaffRequisitionsCreateStaffRequisitionRequest;
};
export type GetApiV1StaffRequisitionsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesStaffRequisitionsStaffRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1StaffRequisitionsApiArg = {
  appointmentType?: DomainEntitiesStaffRequisitionsAppointmentType;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1StaffRequisitionsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesStaffRequisitionsStaffRequisitionDto;
export type GetApiV1StaffRequisitionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1StaffRequisitionsByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesStaffRequisitionsStaffRequisitionDto;
export type PutApiV1StaffRequisitionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesStaffRequisitionsCreateStaffRequisitionRequest: DomainEntitiesStaffRequisitionsCreateStaffRequisitionRequest;
};
export type DeleteApiV1StaffRequisitionsByIdApiResponse = void;
export type DeleteApiV1StaffRequisitionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DomainEntitiesAttendanceRecordsAttendanceRecordDepartmentDto = {
  staffName?: string | null;
  employeeId?: string | null;
  shiftName?: string | null;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  workHours?: number;
};
export type DomainEntitiesAttendanceRecordsGeneralAttendanceReportDto = {
  departmentName?: string | null;
  permanentStaff?: number;
  casualStaff?: number;
  permanentEarlyMorning?: number;
  permanentMorning?: number;
  permanentAfternoon?: number;
  permanentNight?: number;
  casualEarlyMorning?: number;
  casualMorning?: number;
  casualAfternoon?: number;
  casualNight?: number;
  approvedLeaves?: number;
  absences?: number;
  suspensions?: number;
  sickLeaves?: number;
  maternityLeaves?: number;
};
export type DomainEntitiesAttendanceRecordsGeneralAttendanceReportDtoRead = {
  departmentName?: string | null;
  permanentStaff?: number;
  casualStaff?: number;
  totalStaff?: number;
  permanentEarlyMorning?: number;
  permanentMorning?: number;
  permanentAfternoon?: number;
  permanentNight?: number;
  casualEarlyMorning?: number;
  casualMorning?: number;
  casualAfternoon?: number;
  casualNight?: number;
  approvedLeaves?: number;
  absences?: number;
  suspensions?: number;
  sickLeaves?: number;
  maternityLeaves?: number;
};
export type DomainEntitiesAttendanceRecordsSystemGeneralStaffCountDto = {
  numberOfPermanentLeaves?: number;
  numberOfCasualLeaves?: number;
  numberOfPermanentSickLeaves?: number;
  numberOfCasualSickLeaves?: number;
  numberOfPermanentMaternityLeave?: number;
  numberOfCasualMaternityLeave?: number;
  numberOfPermanentAbsentEmployees?: number;
  numberOfCasualAbsentEmployees?: number;
  numberOfPermanentOfficialDuty?: number;
  numberOfCasualOfficialDuty?: number;
  numberOfPermanentSuspensions?: number;
  numberOfCasualSuspensions?: number;
  department?: string | null;
};
export type DomainEntitiesAttendanceRecordsSystemGeneralStats = {
  numberOfPermanentLeaves?: number;
  numberOfCasualLeaves?: number;
  numberOfPermanentSickLeaves?: number;
  numberOfCasualSickLeaves?: number;
  numberOfPermanentMaternityLeave?: number;
  numberOfCasualMaternityLeave?: number;
  numberOfPermanentAbsentEmployees?: number;
  numberOfCasualAbsentEmployees?: number;
  numberOfPermanentOfficialDuty?: number;
  numberOfCasualOfficialDuty?: number;
  numberOfPermanentSuspensions?: number;
  numberOfCasualSuspensions?: number;
};
export type DomainEntitiesAttendanceRecordsGeneralSystemReport = {
  departments?:
    DomainEntitiesAttendanceRecordsSystemGeneralStaffCountDto[] | null;
  totals?: DomainEntitiesAttendanceRecordsSystemGeneralStats;
};
export type DomainEntitiesAttendanceRecordsGeneralAttendanceReportResponse = {
  departmentReports?:
    DomainEntitiesAttendanceRecordsGeneralAttendanceReportDto[] | null;
  systemStatistics?: DomainEntitiesAttendanceRecordsGeneralSystemReport;
};
export type DomainEntitiesAttendanceRecordsGeneralAttendanceReportResponseRead =
  {
    departmentReports?:
      DomainEntitiesAttendanceRecordsGeneralAttendanceReportDtoRead[] | null;
    systemStatistics?: DomainEntitiesAttendanceRecordsGeneralSystemReport;
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
export type DomainEntitiesDesignationsCreateDesignationRequest = {
  name: string;
  description?: string | null;
  maximumLeaveDays: number;
  departmentIds: string[];
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
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesWarehousesWarehouseDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  locations?: SharedCollectionItemDto[] | null;
};
export type DomainEntitiesDepartmentsDepartmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouseDto[] | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
  isSeeded?: boolean;
};
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesEmployeesGender = 0 | 1;
export type DomainEntitiesEmployeesMaritalStatus = 0 | 1;
export type DomainEntitiesEmployeesReligion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DomainEntitiesEmployeesEmployeeType = 0 | 1;
export type DomainEntitiesPersonsLifeStatus = 0 | 1;
export type DomainEntitiesPersonsPersonDto = {
  fullName?: string | null;
  phoneNumber?: string | null;
  occupation?: string | null;
  lifeStatus?: DomainEntitiesPersonsLifeStatus;
};
export type DomainEntitiesEmergencyContactsEmergencyContactDto = {
  fullName?: string | null;
  contactNumber?: string | null;
  relationship?: string | null;
  residentialAddress?: string | null;
};
export type DomainEntitiesChildrenChildDto = {
  fullName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesSiblingsSiblingDto = {
  fullName?: string | null;
  contact?: string | null;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesEducationHistoriesEducationDto = {
  schoolName?: string | null;
  startDate?: string;
  endDate?: string;
  major?: string | null;
  qualificationEarned?: string | null;
};
export type DomainEntitiesEmployeeHistoriesEmploymentHistoryDto = {
  companyName?: string | null;
  startDate?: string;
  endDate?: string;
  position?: string | null;
};
export type DomainEntitiesEmployeesEmployeeLevel = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeStatus = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeActiveStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesEmployeesEmployeeInactiveStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesEmployeesEmployeeDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  annualLeaveDays?: number;
  nationality?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  type?: DomainEntitiesEmployeesEmployeeType;
  dateEmployed?: string;
  designation?: DomainEntitiesDesignationsDesignationDto;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUserDto;
  mother?: DomainEntitiesPersonsPersonDto;
  father?: DomainEntitiesPersonsPersonDto;
  spouse?: DomainEntitiesPersonsPersonDto;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  children?: DomainEntitiesChildrenChildDto[] | null;
  siblings?: DomainEntitiesSiblingsSiblingDto[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducationDto[] | null;
  employmentHistory?:
    DomainEntitiesEmployeeHistoriesEmploymentHistoryDto[] | null;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
};
export type DomainEntitiesDesignationsDesignationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartmentDto[] | null;
  employees?: DomainEntitiesEmployeesEmployeeDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesDesignationsDesignationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesDesignationsDesignationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesEmployeesEmployeeInvitationResult = {
  email?: string | null;
  sent?: boolean;
  problem?: string | null;
};
export type DomainEntitiesEmployeesEmployeeInviteDto = {
  name?: string | null;
  email: string;
  employeeType: DomainEntitiesEmployeesEmployeeType;
};
export type DomainEntitiesEmployeesOnboardEmployeeDto = {
  emailList: DomainEntitiesEmployeesEmployeeInviteDto[];
};
export type DomainEntitiesEmployeesCreateEmployeeRequest = {
  avatar?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  phoneNumber?: string | null;
  region?: string | null;
  type?: DomainEntitiesEmployeesEmployeeType;
  nationality?: string | null;
  residentialAddress?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  dateEmployed?: string;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  staffNumber?: string | null;
  email?: string | null;
  mother?: DomainEntitiesPersonsPersonDto;
  father?: DomainEntitiesPersonsPersonDto;
  spouse?: DomainEntitiesPersonsPersonDto;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  children?: DomainEntitiesChildrenChildDto[] | null;
  siblings?: DomainEntitiesSiblingsSiblingDto[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducationDto[] | null;
  employmentHistory?:
    DomainEntitiesEmployeeHistoriesEmploymentHistoryDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesEmployeesEmployeeDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesEmployeesEmployeeDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesEmployeesEmployeeSortBy = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type SharedSortDirection = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeUserDto = {
  employeeId: string;
  roleId: string;
};
export type SharedRequestsUploadFileRequest = {
  file?: string | null;
};
export type DomainEntitiesEmployeesMinimalEmployeeInfoDto = {
  employeeId?: string;
  firstName?: string | null;
  lastName?: string | null;
  staffNumber?: string | null;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  type?: string | null;
  department?: string | null;
  designation?: string | null;
};
export type DomainEntitiesEmployeesUpdateEmployeeRequest = {
  avatar?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  phoneNumber?: string | null;
  region?: string | null;
  type?: DomainEntitiesEmployeesEmployeeType;
  nationality?: string | null;
  residentialAddress?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  dateEmployed?: string;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  staffNumber?: string | null;
  email?: string | null;
  mother?: DomainEntitiesPersonsPersonDto;
  father?: DomainEntitiesPersonsPersonDto;
  spouse?: DomainEntitiesPersonsPersonDto;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  children?: DomainEntitiesChildrenChildDto[] | null;
  siblings?: DomainEntitiesSiblingsSiblingDto[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducationDto[] | null;
  employmentHistory?:
    DomainEntitiesEmployeeHistoriesEmploymentHistoryDto[] | null;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
};
export type DomainEntitiesEmployeesAssignEmployeeDto = {
  designationId: string;
  departmentId: string;
  warehouseIds?: string[] | null;
  staffNumber?: string | null;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  startDate?: string;
  reportingManagerId?: string;
};
export type DomainEntitiesEmployeesUpdateEmployeeStatus = {
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
};
export type DomainEntitiesLeaveEntitlementsLeaveEntitlementDto = {
  employeeId: string;
  year: number;
  daysAllowed?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveEntitlementsLeaveEntitlementDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesLeaveEntitlementsLeaveEntitlementDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesLeaveRequestsRequestCategory = 0 | 1 | 2 | 3;
export type DomainEntitiesLeaveRequestsCreateLeaveRequest = {
  leaveTypeId?: string | null;
  startDate: string;
  endDate: string;
  employeeId: string;
  requestCategory: DomainEntitiesLeaveRequestsRequestCategory;
  contactPerson?: string | null;
  contactPersonNumber?: string | null;
  destination?: string | null;
  justification?: string | null;
};
export type DomainEntitiesLeaveTypesLeaveTypeDto = {
  id?: string;
  name?: string | null;
  isPaid?: boolean;
  deductFromBalance?: boolean;
  deductionLimit?: number | null;
  numberOfDays?: number;
  isActive?: boolean;
  designations?: DomainEntitiesDesignationsDesignationDto[] | null;
};
export type DomainEntitiesLeaveRequestsLeaveStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesLeaveRequestsLeaveRequestDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  leaveTypeId?: string | null;
  leaveType?: DomainEntitiesLeaveTypesLeaveTypeDto;
  startDate?: string;
  endDate?: string;
  contactPerson?: string | null;
  contactPersonNumber?: string | null;
  recallDate?: string;
  justification?: string | null;
  requestCategory?: DomainEntitiesLeaveRequestsRequestCategory;
  leaveStatus?: DomainEntitiesLeaveRequestsLeaveStatus;
  unpaidDays?: number;
  paidDays?: number;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployeeDto;
  destination?: string | null;
};
export type DomainEntitiesLeaveRequestsLeaveRequestDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  leaveTypeId?: string | null;
  leaveType?: DomainEntitiesLeaveTypesLeaveTypeDto;
  startDate?: string;
  endDate?: string;
  contactPerson?: string | null;
  contactPersonNumber?: string | null;
  recallDate?: string;
  justification?: string | null;
  requestCategory?: DomainEntitiesLeaveRequestsRequestCategory;
  leaveStatus?: DomainEntitiesLeaveRequestsLeaveStatus;
  unpaidDays?: number;
  paidDays?: number;
  numberOfDays?: number;
  numberOfDaysUsed?: number;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployeeDto;
  leaveBalance?: number;
  destination?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveRequestsLeaveRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesLeaveRequestsLeaveRequestDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveRequestsLeaveRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesLeaveRequestsLeaveRequestDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesLeaveRequestsCreateLeaveRecallRequest = {
  employeeId: string;
  recallDate: string;
  recallReason?: string | null;
};
export type DomainEntitiesLeaveRequestsReapplyLeaveRequest = {
  newStartDate?: string;
  newEndDate?: string;
  justification?: string | null;
};
export type DomainEntitiesLeaveTypesCreateLeaveTypeRequest = {
  name: string;
  isPaid: boolean;
  deductFromBalance: boolean;
  deductionLimit?: number | null;
  numberOfDays: number;
  isActive: boolean;
  designationList: string[];
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesLeaveTypesLeaveTypeDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesLeaveTypesLeaveTypeDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesEmployeesOnboardingInvitationDto = {
  email?: string | null;
  name?: string | null;
  employeeType?: DomainEntitiesEmployeesEmployeeType;
  expiresAt?: string;
};
export type DomainEntitiesEmployeesOnboardingTokenRequest = {
  token: string;
};
export type DomainEntitiesEmployeesCompleteOnboardingRequest = {
  token: string;
  employee: DomainEntitiesEmployeesCreateEmployeeRequest;
};
export type DomainEntitiesEmployeesOnboardingAvatarRequest = {
  token: string;
  file: string;
};
export type DomainEntitiesOvertimeRequestsCreateOvertimeRequest = {
  code: string;
  employeeIds: string[];
  overtimeDate: string;
  departmentId: string;
  startTime: string;
  endTime: string;
  justification?: string | null;
};
export type DomainEntitiesOvertimeRequestsOvertimeStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesOvertimeRequestsOvertimeRequestDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  employees?: DomainEntitiesEmployeesEmployeeDto[] | null;
  overtimeDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  status?: DomainEntitiesOvertimeRequestsOvertimeStatus;
  justification?: string | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  totalHours?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesOvertimeRequestsOvertimeRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesOvertimeRequestsOvertimeRequestDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesPerformanceCreateGoalRequest = {
  employeeId?: string;
  cycleId?: string;
  title?: string | null;
  description?: string | null;
  weight?: number;
  targetDate?: string;
};
export type DomainEntitiesPerformanceGoalStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesPerformanceUpdateGoalRequest = {
  title?: string | null;
  description?: string | null;
  weight?: number;
  targetDate?: string;
  status?: DomainEntitiesPerformanceGoalStatus;
  progressPercentage?: number;
  managerComments?: string | null;
};
export type DomainEntitiesShiftAssignmentsCreateShiftCategoryRequest = {
  name: string;
};
export type DomainEntitiesShiftAssignmentsShiftCategoryDto = {
  id?: string;
  name?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShiftAssignmentsShiftCategoryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesShiftAssignmentsShiftCategoryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesShiftSchedulesScheduleFrequency =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesShiftSchedulesCreateShiftScheduleRequest = {
  scheduleName: string;
  frequency: DomainEntitiesShiftSchedulesScheduleFrequency;
  startDate: string;
  shiftTypeIds: string[];
  departmentId: string;
};
export type DomainEntitiesShiftTypesRotationType = 0 | 1;
export type SystemDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesShiftTypesShiftTypeDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  shiftName?: string | null;
  rotationType?: DomainEntitiesShiftTypesRotationType;
  startTime?: string | null;
  endTime?: string | null;
  applicableDays?: SystemDayOfWeek[] | null;
};
export type DomainEntitiesShiftSchedulesScheduleStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesShiftSchedulesShiftScheduleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  scheduleName?: string | null;
  startDate?: string;
  endDate?: string;
  frequency?: DomainEntitiesShiftSchedulesScheduleFrequency;
  shiftType?: DomainEntitiesShiftTypesShiftTypeDto[] | null;
  departmentId?: string;
  scheduleStatus?: DomainEntitiesShiftSchedulesScheduleStatus;
  department?: DomainEntitiesDepartmentsDepartmentDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShiftSchedulesShiftScheduleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesShiftSchedulesShiftScheduleDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesShiftTypesMinimalShiftTypeDto = {
  shiftTypeId?: string;
  shiftName?: string | null;
};
export type DomainEntitiesShiftAssignmentsMinimalShiftScheduleDto = {
  scheduleId?: string;
  scheduleName?: string | null;
  startDate?: string;
  endDate?: string;
};
export type DomainEntitiesShiftAssignmentsShiftAssignmentDto = {
  employees?: DomainEntitiesEmployeesMinimalEmployeeInfoDto[] | null;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
  shiftCategory?: DomainEntitiesShiftAssignmentsShiftCategoryDto;
  shiftType?: DomainEntitiesShiftTypesMinimalShiftTypeDto;
  shiftSchedule?: DomainEntitiesShiftAssignmentsMinimalShiftScheduleDto;
};
export type DomainEntitiesShiftAssignmentsUpdateShiftAssignment = {
  shiftCategoryId: string;
  scheduleDate: string;
  addEmployeeIds?: string[] | null;
  removeEmployeeIds?: string[] | null;
};
export type DomainEntitiesShiftTypesCreateShiftTypeRequest = {
  shiftName: string;
  rotationType: DomainEntitiesShiftTypesRotationType;
  startTime: string;
  endTime: string;
  applicableDays: SystemDayOfWeek[];
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShiftTypesShiftTypeDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesShiftTypesShiftTypeDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesStaffRequisitionsBudgetStatus = 0 | 1;
export type DomainEntitiesStaffRequisitionsAppointmentType = 0 | 1;
export type DomainEntitiesStaffRequisitionsCreateStaffRequisitionRequest = {
  budgetStatus: DomainEntitiesStaffRequisitionsBudgetStatus;
  staffRequired: number;
  educationalQualification: string;
  qualification: string;
  designationId: string;
  departmentId: string;
  additionalRequests?: string | null;
  appointmentType: DomainEntitiesStaffRequisitionsAppointmentType;
  requestUrgency: string;
  justification?: string | null;
  additionalRequirements?: string | null;
  departmentName?: string | null;
};
export type DomainEntitiesStaffRequisitionsStaffRequisitionStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesStaffRequisitionsStaffRequisitionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  budgetStatus?: DomainEntitiesStaffRequisitionsBudgetStatus;
  staffRequired?: number;
  qualification?: string | null;
  educationalQualification?: string | null;
  additionalRequests?: string | null;
  departmentName?: string | null;
  appointmentType?: DomainEntitiesStaffRequisitionsAppointmentType;
  staffRequisitionStatus?: DomainEntitiesStaffRequisitionsStaffRequisitionStatus;
  requestUrgency?: string;
  justification?: string | null;
  additionalRequirements?: string | null;
  designationId?: string;
  designation?: DomainEntitiesDesignationsDesignationDto;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartmentDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesStaffRequisitionsStaffRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesStaffRequisitionsStaffRequisitionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export const {
  useGetApiV1AttendanceRecordsDailySummaryQuery,
  useLazyGetApiV1AttendanceRecordsDailySummaryQuery,
  useGetApiV1AttendanceRecordsGeneralSummaryQuery,
  useLazyGetApiV1AttendanceRecordsGeneralSummaryQuery,
  usePostApiV1DesignationMutation,
  useGetApiV1DesignationQuery,
  useLazyGetApiV1DesignationQuery,
  useGetApiV1DesignationByIdQuery,
  useLazyGetApiV1DesignationByIdQuery,
  usePutApiV1DesignationByIdMutation,
  useDeleteApiV1DesignationByIdMutation,
  useGetApiV1DesignationDepartmentByIdQuery,
  useLazyGetApiV1DesignationDepartmentByIdQuery,
  usePostApiV1EmployeeRegisterMutation,
  usePostApiV1EmployeeMutation,
  useGetApiV1EmployeeQuery,
  useLazyGetApiV1EmployeeQuery,
  usePostApiV1EmployeeUserMutation,
  usePostApiV1EmployeeAvatarByIdMutation,
  useGetApiV1EmployeeDepartmentsByIdQuery,
  useLazyGetApiV1EmployeeDepartmentsByIdQuery,
  useGetApiV1EmployeeByShiftScheduleIdAvailableQuery,
  useLazyGetApiV1EmployeeByShiftScheduleIdAvailableQuery,
  useGetApiV1EmployeeByIdQuery,
  useLazyGetApiV1EmployeeByIdQuery,
  usePutApiV1EmployeeByIdMutation,
  useDeleteApiV1EmployeeByIdMutation,
  usePutApiV1EmployeeByIdAssignMutation,
  usePutApiV1EmployeeByIdChangeTypeMutation,
  usePutApiV1EmployeeByIdStatusMutation,
  usePutApiV1EmployeeEmailByIdMutation,
  useGetApiV1EmployeeMeQuery,
  useLazyGetApiV1EmployeeMeQuery,
  usePostApiV1LeaveEntitlementMutation,
  useGetApiV1LeaveEntitlementQuery,
  useLazyGetApiV1LeaveEntitlementQuery,
  useGetApiV1LeaveEntitlementByIdQuery,
  useLazyGetApiV1LeaveEntitlementByIdQuery,
  usePutApiV1LeaveEntitlementByIdMutation,
  useDeleteApiV1LeaveEntitlementByIdMutation,
  usePostApiV1LeaveRequestMutation,
  useGetApiV1LeaveRequestQuery,
  useLazyGetApiV1LeaveRequestQuery,
  useGetApiV1LeaveRequestByIdQuery,
  useLazyGetApiV1LeaveRequestByIdQuery,
  usePutApiV1LeaveRequestByIdMutation,
  useDeleteApiV1LeaveRequestByIdMutation,
  usePutApiV1LeaveRequestRecallMutation,
  usePutApiV1LeaveRequestByLeaveRequestIdReapplyMutation,
  usePostApiV1LeaveRequestByIdCancelMutation,
  usePostApiV1LeaveTypeMutation,
  useGetApiV1LeaveTypeQuery,
  useLazyGetApiV1LeaveTypeQuery,
  useGetApiV1LeaveTypeByIdQuery,
  useLazyGetApiV1LeaveTypeByIdQuery,
  usePutApiV1LeaveTypeByIdMutation,
  useDeleteApiV1LeaveTypeByIdMutation,
  usePostApiV1OnboardingInvitationMutation,
  usePostApiV1OnboardingSubmitMutation,
  usePostApiV1OnboardingPhotoMutation,
  usePostApiV1OvertimeRequestsMutation,
  useGetApiV1OvertimeRequestsQuery,
  useLazyGetApiV1OvertimeRequestsQuery,
  useGetApiV1OvertimeRequestsByIdQuery,
  useLazyGetApiV1OvertimeRequestsByIdQuery,
  usePutApiV1OvertimeRequestsByIdMutation,
  useDeleteApiV1OvertimeRequestsByIdMutation,
  usePostApiV1PerformanceGoalsMutation,
  usePutApiV1PerformanceGoalsByIdMutation,
  useDeleteApiV1PerformanceGoalsByIdMutation,
  usePostApiV1ShiftCategoryMutation,
  useGetApiV1ShiftCategoryQuery,
  useLazyGetApiV1ShiftCategoryQuery,
  useGetApiV1ShiftCategoryByIdQuery,
  useLazyGetApiV1ShiftCategoryByIdQuery,
  usePutApiV1ShiftCategoryByIdMutation,
  useDeleteApiV1ShiftCategoryByIdMutation,
  usePostApiV1ShiftSchedulesMutation,
  useGetApiV1ShiftSchedulesQuery,
  useLazyGetApiV1ShiftSchedulesQuery,
  useGetApiV1ShiftSchedulesByIdQuery,
  useLazyGetApiV1ShiftSchedulesByIdQuery,
  usePutApiV1ShiftSchedulesByIdMutation,
  useDeleteApiV1ShiftSchedulesByIdMutation,
  useGetApiV1ShiftSchedulesDepartmentByIdQuery,
  useLazyGetApiV1ShiftSchedulesDepartmentByIdQuery,
  useGetApiV1ShiftSchedulesByScheduleIdViewQuery,
  useLazyGetApiV1ShiftSchedulesByScheduleIdViewQuery,
  useGetApiV1ShiftSchedulesByScheduleIdDayQuery,
  useLazyGetApiV1ShiftSchedulesByScheduleIdDayQuery,
  usePutApiV1ShiftSchedulesByIdUpdateScheduleMutation,
  usePostApiV1ShiftSchedulesAssignImportMutation,
  usePostApiV1ShiftTypeMutation,
  useGetApiV1ShiftTypeQuery,
  useLazyGetApiV1ShiftTypeQuery,
  useGetApiV1ShiftTypeByIdQuery,
  useLazyGetApiV1ShiftTypeByIdQuery,
  usePutApiV1ShiftTypeByIdMutation,
  useDeleteApiV1ShiftTypeByIdMutation,
  usePostApiV1StaffRequisitionsMutation,
  useGetApiV1StaffRequisitionsQuery,
  useLazyGetApiV1StaffRequisitionsQuery,
  useGetApiV1StaffRequisitionsByIdQuery,
  useLazyGetApiV1StaffRequisitionsByIdQuery,
  usePutApiV1StaffRequisitionsByIdMutation,
  useDeleteApiV1StaffRequisitionsByIdMutation,
} = injectedRtkApi;
