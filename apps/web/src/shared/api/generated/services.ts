import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1Tickets: build.mutation<
      PostApiV1TicketsApiResponse,
      PostApiV1TicketsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets`,
        method: "POST",
        body: queryArg.domainEntitiesTicketsCreateTicketRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Tickets: build.query<
      GetApiV1TicketsApiResponse,
      GetApiV1TicketsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          priority: queryArg.priority,
          category: queryArg.category,
          assignedToId: queryArg.assignedToId,
          reportedById: queryArg.reportedById,
        },
      }),
    }),
    getApiV1TicketsById: build.query<
      GetApiV1TicketsByIdApiResponse,
      GetApiV1TicketsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TicketsByIdAssign: build.mutation<
      PutApiV1TicketsByIdAssignApiResponse,
      PutApiV1TicketsByIdAssignApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/assign`,
        method: "PUT",
        body: queryArg.domainEntitiesTicketsAssignTicketRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TicketsByIdStart: build.mutation<
      PutApiV1TicketsByIdStartApiResponse,
      PutApiV1TicketsByIdStartApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/start`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TicketsByIdDone: build.mutation<
      PutApiV1TicketsByIdDoneApiResponse,
      PutApiV1TicketsByIdDoneApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/done`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TicketsByIdClose: build.mutation<
      PutApiV1TicketsByIdCloseApiResponse,
      PutApiV1TicketsByIdCloseApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/close`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TicketsByIdReopen: build.mutation<
      PutApiV1TicketsByIdReopenApiResponse,
      PutApiV1TicketsByIdReopenApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/reopen`,
        method: "PUT",
        body: queryArg.domainEntitiesTicketsReopenTicketRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1TicketsByIdComments: build.mutation<
      PostApiV1TicketsByIdCommentsApiResponse,
      PostApiV1TicketsByIdCommentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/comments`,
        method: "POST",
        body: queryArg.domainEntitiesTicketsAddTicketCommentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1TicketsByIdActivity: build.query<
      GetApiV1TicketsByIdActivityApiResponse,
      GetApiV1TicketsByIdActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/tickets/${queryArg.id}/activity`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrders: build.mutation<
      PostApiV1JobOrdersApiResponse,
      PostApiV1JobOrdersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCreateJobOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1JobOrders: build.query<
      GetApiV1JobOrdersApiResponse,
      GetApiV1JobOrdersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          status: queryArg.status,
          jobRequestId: queryArg.jobRequestId,
          serviceId: queryArg.serviceId,
        },
      }),
    }),
    getApiV1JobOrdersById: build.query<
      GetApiV1JobOrdersByIdApiResponse,
      GetApiV1JobOrdersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1JobOrdersServiceProviders: build.query<
      GetApiV1JobOrdersServiceProvidersApiResponse,
      GetApiV1JobOrdersServiceProvidersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/service-providers`,
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
    postApiV1JobOrdersSendToProviders: build.mutation<
      PostApiV1JobOrdersSendToProvidersApiResponse,
      PostApiV1JobOrdersSendToProvidersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/send-to-providers`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsSendJobOrderToProvidersRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersSelectQuotation: build.mutation<
      PostApiV1JobOrdersSelectQuotationApiResponse,
      PostApiV1JobOrdersSelectQuotationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/select-quotation`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsSelectQuotationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersStartExecution: build.mutation<
      PostApiV1JobOrdersStartExecutionApiResponse,
      PostApiV1JobOrdersStartExecutionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/start-execution`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsStartJobOrderExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersExecutionsByIdActivities: build.mutation<
      PostApiV1JobOrdersExecutionsByIdActivitiesApiResponse,
      PostApiV1JobOrdersExecutionsByIdActivitiesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/executions/${queryArg.id}/activities`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsRecordJobActivityRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersExecutionsByIdConsumedItems: build.mutation<
      PostApiV1JobOrdersExecutionsByIdConsumedItemsApiResponse,
      PostApiV1JobOrdersExecutionsByIdConsumedItemsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/executions/${queryArg.id}/consumed-items`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsRecordConsumedItemRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersCompleteExecution: build.mutation<
      PostApiV1JobOrdersCompleteExecutionApiResponse,
      PostApiV1JobOrdersCompleteExecutionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/complete-execution`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCompleteJobOrderExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersVerifyExecution: build.mutation<
      PostApiV1JobOrdersVerifyExecutionApiResponse,
      PostApiV1JobOrdersVerifyExecutionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/verify-execution`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsVerifyJobOrderExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobOrdersApproveExecution: build.mutation<
      PostApiV1JobOrdersApproveExecutionApiResponse,
      PostApiV1JobOrdersApproveExecutionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-orders/approve-execution`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsApproveJobOrderExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobRequests: build.mutation<
      PostApiV1JobRequestsApiResponse,
      PostApiV1JobRequestsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCreateJobRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1JobRequests: build.query<
      GetApiV1JobRequestsApiResponse,
      GetApiV1JobRequestsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          handlingType: queryArg.handlingType,
        },
      }),
    }),
    getApiV1JobRequestsById: build.query<
      GetApiV1JobRequestsByIdApiResponse,
      GetApiV1JobRequestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1JobRequestsById: build.mutation<
      PutApiV1JobRequestsByIdApiResponse,
      PutApiV1JobRequestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesJobRequestsUpdateJobRequestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1JobRequestsById: build.mutation<
      DeleteApiV1JobRequestsByIdApiResponse,
      DeleteApiV1JobRequestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1JobRequestsOrders: build.query<
      GetApiV1JobRequestsOrdersApiResponse,
      GetApiV1JobRequestsOrdersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/orders`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobRequestsAssignInternal: build.mutation<
      PostApiV1JobRequestsAssignInternalApiResponse,
      PostApiV1JobRequestsAssignInternalApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/assign-internal`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsAssignInternalJobRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1JobRequestsStatusById: build.mutation<
      PutApiV1JobRequestsStatusByIdApiResponse,
      PutApiV1JobRequestsStatusByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/status/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesJobRequestsUpdateJobRequestStatusRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1JobRequestsCompletedInternal: build.query<
      GetApiV1JobRequestsCompletedInternalApiResponse,
      GetApiV1JobRequestsCompletedInternalApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/completed/internal`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          employeeId: queryArg.employeeId,
        },
      }),
    }),
    postApiV1JobRequestsComplete: build.mutation<
      PostApiV1JobRequestsCompleteApiResponse,
      PostApiV1JobRequestsCompleteApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-requests/complete`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCompleteJobRequestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1JobExecutions: build.query<
      GetApiV1JobExecutionsApiResponse,
      GetApiV1JobExecutionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          status: queryArg.status,
          employeeId: queryArg.employeeId,
          jobRequestId: queryArg.jobRequestId,
        },
      }),
    }),
    getApiV1JobExecutionsById: build.query<
      GetApiV1JobExecutionsByIdApiResponse,
      GetApiV1JobExecutionsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsAcknowledge: build.mutation<
      PostApiV1JobExecutionsAcknowledgeApiResponse,
      PostApiV1JobExecutionsAcknowledgeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/acknowledge`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsAcknowledgeJobExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsStart: build.mutation<
      PostApiV1JobExecutionsStartApiResponse,
      PostApiV1JobExecutionsStartApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/start`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsStartJobExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsByIdActivities: build.mutation<
      PostApiV1JobExecutionsByIdActivitiesApiResponse,
      PostApiV1JobExecutionsByIdActivitiesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/${queryArg.id}/activities`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsRecordJobActivityRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsByIdConsumedItems: build.mutation<
      PostApiV1JobExecutionsByIdConsumedItemsApiResponse,
      PostApiV1JobExecutionsByIdConsumedItemsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/${queryArg.id}/consumed-items`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsRecordConsumedItemRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsComplete: build.mutation<
      PostApiV1JobExecutionsCompleteApiResponse,
      PostApiV1JobExecutionsCompleteApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/complete`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCompleteJobExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsReassign: build.mutation<
      PostApiV1JobExecutionsReassignApiResponse,
      PostApiV1JobExecutionsReassignApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/reassign`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsReassignJobExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsVerify: build.mutation<
      PostApiV1JobExecutionsVerifyApiResponse,
      PostApiV1JobExecutionsVerifyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/verify`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsVerifyJobExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1JobExecutionsApprove: build.mutation<
      PostApiV1JobExecutionsApproveApiResponse,
      PostApiV1JobExecutionsApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/job-executions/approve`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsApproveJobExecutionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceMemos: build.mutation<
      PostApiV1ServiceMemosApiResponse,
      PostApiV1ServiceMemosApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-memos`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCreateServiceMemoRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ServiceMemos: build.query<
      GetApiV1ServiceMemosApiResponse,
      GetApiV1ServiceMemosApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-memos`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          status: queryArg.status,
          jobOrderId: queryArg.jobOrderId,
          serviceProviderId: queryArg.serviceProviderId,
        },
      }),
    }),
    getApiV1ServiceMemosById: build.query<
      GetApiV1ServiceMemosByIdApiResponse,
      GetApiV1ServiceMemosByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-memos/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ServiceMemosById: build.mutation<
      PutApiV1ServiceMemosByIdApiResponse,
      PutApiV1ServiceMemosByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-memos/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesJobRequestsUpdateServiceMemoRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ServiceMemosPaidById: build.mutation<
      PutApiV1ServiceMemosPaidByIdApiResponse,
      PutApiV1ServiceMemosPaidByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-memos/paid/${queryArg.id}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceMemosIssue: build.mutation<
      PostApiV1ServiceMemosIssueApiResponse,
      PostApiV1ServiceMemosIssueApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-memos/issue`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsIssueServiceMemoRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceProformaInvoicesRequest: build.mutation<
      PostApiV1ServiceProformaInvoicesRequestApiResponse,
      PostApiV1ServiceProformaInvoicesRequestApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-proforma-invoices/request`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsRequestServiceProformaInvoiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceProformaInvoicesRespond: build.mutation<
      PostApiV1ServiceProformaInvoicesRespondApiResponse,
      PostApiV1ServiceProformaInvoicesRespondApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-proforma-invoices/respond`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsRespondServiceProformaInvoiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceProformaInvoicesApprove: build.mutation<
      PostApiV1ServiceProformaInvoicesApproveApiResponse,
      PostApiV1ServiceProformaInvoicesApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-proforma-invoices/approve`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsApproveServiceProformaInvoiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ServiceProformaInvoices: build.query<
      GetApiV1ServiceProformaInvoicesApiResponse,
      GetApiV1ServiceProformaInvoicesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-proforma-invoices`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          status: queryArg.status,
          jobOrderId: queryArg.jobOrderId,
          serviceProviderId: queryArg.serviceProviderId,
        },
      }),
    }),
    getApiV1ServiceProformaInvoicesById: build.query<
      GetApiV1ServiceProformaInvoicesByIdApiResponse,
      GetApiV1ServiceProformaInvoicesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-proforma-invoices/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceProviders: build.mutation<
      PostApiV1ServiceProvidersApiResponse,
      PostApiV1ServiceProvidersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-providers`,
        method: "POST",
        body: queryArg.domainEntitiesServiceProvidersCreateServiceProviderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ServiceProviders: build.query<
      GetApiV1ServiceProvidersApiResponse,
      GetApiV1ServiceProvidersApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-providers`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          serviceId: queryArg.serviceId,
        },
      }),
    }),
    getApiV1ServiceProvidersById: build.query<
      GetApiV1ServiceProvidersByIdApiResponse,
      GetApiV1ServiceProvidersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-providers/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ServiceProvidersById: build.mutation<
      PutApiV1ServiceProvidersByIdApiResponse,
      PutApiV1ServiceProvidersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-providers/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesServiceProvidersCreateServiceProviderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ServiceProvidersById: build.mutation<
      DeleteApiV1ServiceProvidersByIdApiResponse,
      DeleteApiV1ServiceProvidersByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-providers/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ServiceProvidersServiceByServiceId: build.query<
      GetApiV1ServiceProvidersServiceByServiceIdApiResponse,
      GetApiV1ServiceProvidersServiceByServiceIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-providers/service/${queryArg.serviceId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceQuotations: build.mutation<
      PostApiV1ServiceQuotationsApiResponse,
      PostApiV1ServiceQuotationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-quotations`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsCreateServiceQuotationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ServiceQuotations: build.query<
      GetApiV1ServiceQuotationsApiResponse,
      GetApiV1ServiceQuotationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-quotations`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          status: queryArg.status,
          jobOrderId: queryArg.jobOrderId,
          serviceProviderId: queryArg.serviceProviderId,
          jobOrderStatus: queryArg.jobOrderStatus,
          proformaPending: queryArg.proformaPending,
        },
      }),
    }),
    getApiV1ServiceQuotationsById: build.query<
      GetApiV1ServiceQuotationsByIdApiResponse,
      GetApiV1ServiceQuotationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-quotations/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ServiceQuotationsById: build.mutation<
      PutApiV1ServiceQuotationsByIdApiResponse,
      PutApiV1ServiceQuotationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-quotations/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesJobRequestsUpdateServiceQuotationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceQuotationsNegotiate: build.mutation<
      PostApiV1ServiceQuotationsNegotiateApiResponse,
      PostApiV1ServiceQuotationsNegotiateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-quotations/negotiate`,
        method: "POST",
        body: queryArg.domainEntitiesJobRequestsNegotiateQuotationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ServiceQuotationsCompareByJobOrderId: build.mutation<
      PostApiV1ServiceQuotationsCompareByJobOrderIdApiResponse,
      PostApiV1ServiceQuotationsCompareByJobOrderIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/service-quotations/compare/${queryArg.jobOrderId}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Services: build.mutation<
      PostApiV1ServicesApiResponse,
      PostApiV1ServicesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/services`,
        method: "POST",
        body: queryArg.domainEntitiesServicesCreateServiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Services: build.query<
      GetApiV1ServicesApiResponse,
      GetApiV1ServicesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/services`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          isActive: queryArg.isActive,
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
        },
      }),
    }),
    getApiV1ServicesById: build.query<
      GetApiV1ServicesByIdApiResponse,
      GetApiV1ServicesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/services/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ServicesById: build.mutation<
      PutApiV1ServicesByIdApiResponse,
      PutApiV1ServicesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/services/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesServicesCreateServiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ServicesById: build.mutation<
      DeleteApiV1ServicesByIdApiResponse,
      DeleteApiV1ServicesByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/services/${queryArg.id}`,
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
export { injectedRtkApi as servicesApi };
export type PostApiV1TicketsApiResponse = /** status 200 OK */ string;
export type PostApiV1TicketsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesTicketsCreateTicketRequest: DomainEntitiesTicketsCreateTicketRequest;
};
export type GetApiV1TicketsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesTicketsTicketDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1TicketsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesTicketsTicketStatus;
  priority?: DomainEntitiesTicketsTicketPriority;
  category?: DomainEntitiesTicketsTicketCategory;
  assignedToId?: string;
  reportedById?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1TicketsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesTicketsTicketDtoRead;
export type GetApiV1TicketsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1TicketsByIdAssignApiResponse = void;
export type PutApiV1TicketsByIdAssignApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesTicketsAssignTicketRequest: DomainEntitiesTicketsAssignTicketRequest;
};
export type PutApiV1TicketsByIdStartApiResponse = void;
export type PutApiV1TicketsByIdStartApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1TicketsByIdDoneApiResponse = void;
export type PutApiV1TicketsByIdDoneApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1TicketsByIdCloseApiResponse = void;
export type PutApiV1TicketsByIdCloseApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1TicketsByIdReopenApiResponse = void;
export type PutApiV1TicketsByIdReopenApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesTicketsReopenTicketRequest: DomainEntitiesTicketsReopenTicketRequest;
};
export type PostApiV1TicketsByIdCommentsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1TicketsByIdCommentsApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesTicketsAddTicketCommentRequest: DomainEntitiesTicketsAddTicketCommentRequest;
};
export type GetApiV1TicketsByIdActivityApiResponse =
  /** status 200 OK */ DomainEntitiesTicketsTicketActivityDto[];
export type GetApiV1TicketsByIdActivityApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1JobOrdersApiResponse =
  /** status 200 Job order created successfully */ string;
export type PostApiV1JobOrdersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Job order creation details */
  domainEntitiesJobRequestsCreateJobOrderRequest: DomainEntitiesJobRequestsCreateJobOrderRequest;
};
export type GetApiV1JobOrdersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1JobOrdersApiArg = {
  page?: number;
  pageSize?: number;
  status?: DomainEntitiesJobRequestsJobOrderStatus;
  jobRequestId?: string;
  serviceId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1JobOrdersByIdApiResponse =
  /** status 200 OK */ DomainEntitiesJobRequestsJobOrderDto;
export type GetApiV1JobOrdersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1JobOrdersServiceProvidersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobOrderServiceProviderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1JobOrdersServiceProvidersApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1JobOrdersSendToProvidersApiResponse = void;
export type PostApiV1JobOrdersSendToProvidersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Job order and provider IDs */
  domainEntitiesJobRequestsSendJobOrderToProvidersRequest: DomainEntitiesJobRequestsSendJobOrderToProvidersRequest;
};
export type PostApiV1JobOrdersSelectQuotationApiResponse = void;
export type PostApiV1JobOrdersSelectQuotationApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Job order and quotation IDs */
  domainEntitiesJobRequestsSelectQuotationRequest: DomainEntitiesJobRequestsSelectQuotationRequest;
};
export type PostApiV1JobOrdersStartExecutionApiResponse =
  /** status 200 Execution started successfully */ string;
export type PostApiV1JobOrdersStartExecutionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Execution start details */
  domainEntitiesJobRequestsStartJobOrderExecutionRequest: DomainEntitiesJobRequestsStartJobOrderExecutionRequest;
};
export type PostApiV1JobOrdersExecutionsByIdActivitiesApiResponse =
  /** status 200 OK */ string;
export type PostApiV1JobOrdersExecutionsByIdActivitiesApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsRecordJobActivityRequest: DomainEntitiesJobRequestsRecordJobActivityRequest;
};
export type PostApiV1JobOrdersExecutionsByIdConsumedItemsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1JobOrdersExecutionsByIdConsumedItemsApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsRecordConsumedItemRequest: DomainEntitiesJobRequestsRecordConsumedItemRequest;
};
export type PostApiV1JobOrdersCompleteExecutionApiResponse = void;
export type PostApiV1JobOrdersCompleteExecutionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsCompleteJobOrderExecutionRequest: DomainEntitiesJobRequestsCompleteJobOrderExecutionRequest;
};
export type PostApiV1JobOrdersVerifyExecutionApiResponse = void;
export type PostApiV1JobOrdersVerifyExecutionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Verification details */
  domainEntitiesJobRequestsVerifyJobOrderExecutionRequest: DomainEntitiesJobRequestsVerifyJobOrderExecutionRequest;
};
export type PostApiV1JobOrdersApproveExecutionApiResponse = void;
export type PostApiV1JobOrdersApproveExecutionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Approval details including satisfaction status */
  domainEntitiesJobRequestsApproveJobOrderExecutionRequest: DomainEntitiesJobRequestsApproveJobOrderExecutionRequest;
};
export type PostApiV1JobRequestsApiResponse =
  /** status 200 Job request created successfully. Returns the job request ID (Guid) */ string;
export type PostApiV1JobRequestsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Job request creation details */
  domainEntitiesJobRequestsCreateJobRequest: DomainEntitiesJobRequestsCreateJobRequest;
};
export type GetApiV1JobRequestsApiResponse =
  /** status 200 Returns paginated list of job requests with pagination metadata */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1JobRequestsApiArg = {
  /** Page number starting from 1 (default: 1) */
  page?: number;
  /** Number of items per page (default: 10, recommended max: 100) */
  pageSize?: number;
  /** Search term for location, description, or equipment number (case-insensitive) */
  searchQuery?: string;
  /** Filter by job request status enum value (0-9) */
  status?: DomainEntitiesJobRequestsJobRequestStatus;
  /** Filter by handling type enum value (0-2) */
  handlingType?: DomainEntitiesJobRequestsJobHandlingType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1JobRequestsByIdApiResponse =
  /** status 200 Returns complete job request details */ DomainEntitiesJobRequestsJobRequestDto;
export type GetApiV1JobRequestsByIdApiArg = {
  /** Job request unique identifier (Guid) */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1JobRequestsByIdApiResponse = void;
export type PutApiV1JobRequestsByIdApiArg = {
  /** Job request unique identifier (Guid) */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Partial update object with fields to update */
  domainEntitiesJobRequestsUpdateJobRequestRequest: DomainEntitiesJobRequestsUpdateJobRequestRequest;
};
export type DeleteApiV1JobRequestsByIdApiResponse = void;
export type DeleteApiV1JobRequestsByIdApiArg = {
  /** Job request unique identifier (Guid) */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1JobRequestsOrdersApiResponse =
  /** status 200 OK */ DomainEntitiesJobRequestsJobRequestDto;
export type GetApiV1JobRequestsOrdersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1JobRequestsAssignInternalApiResponse =
  /** status 200 Job request assigned successfully. Returns the JobExecution ID (Guid) */ string;
export type PostApiV1JobRequestsAssignInternalApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Assignment details including job request ID, employee ID, and assigner ID */
  domainEntitiesJobRequestsAssignInternalJobRequest: DomainEntitiesJobRequestsAssignInternalJobRequest;
};
export type PutApiV1JobRequestsStatusByIdApiResponse = void;
export type PutApiV1JobRequestsStatusByIdApiArg = {
  /** Job request unique identifier (Guid) */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Request object containing the new status enum value */
  domainEntitiesJobRequestsUpdateJobRequestStatusRequest: DomainEntitiesJobRequestsUpdateJobRequestStatusRequest;
};
export type GetApiV1JobRequestsCompletedInternalApiResponse =
  /** status 200 Returns paginated list of completed job requests with pagination metadata */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1JobRequestsCompletedInternalApiArg = {
  /** Page number starting from 1 (default: 1) */
  page?: number;
  /** Number of items per page (default: 10, recommended max: 100) */
  pageSize?: number;
  /** Search term for location, description, or equipment number (case-insensitive) */
  searchQuery?: string;
  /** Optional employee ID to filter by specific employee */
  employeeId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1JobRequestsCompleteApiResponse = void;
export type PostApiV1JobRequestsCompleteApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Completion request with job request ID and activity performed note */
  domainEntitiesJobRequestsCompleteJobRequestRequest: DomainEntitiesJobRequestsCompleteJobRequestRequest;
};
export type GetApiV1JobExecutionsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobExecutionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1JobExecutionsApiArg = {
  page?: number;
  pageSize?: number;
  status?: DomainEntitiesJobRequestsJobExecutionStatus;
  employeeId?: string;
  jobRequestId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1JobExecutionsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesJobRequestsJobExecutionDto;
export type GetApiV1JobExecutionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1JobExecutionsAcknowledgeApiResponse = void;
export type PostApiV1JobExecutionsAcknowledgeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsAcknowledgeJobExecutionRequest: DomainEntitiesJobRequestsAcknowledgeJobExecutionRequest;
};
export type PostApiV1JobExecutionsStartApiResponse = void;
export type PostApiV1JobExecutionsStartApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsStartJobExecutionRequest: DomainEntitiesJobRequestsStartJobExecutionRequest;
};
export type PostApiV1JobExecutionsByIdActivitiesApiResponse =
  /** status 200 OK */ string;
export type PostApiV1JobExecutionsByIdActivitiesApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsRecordJobActivityRequest: DomainEntitiesJobRequestsRecordJobActivityRequest;
};
export type PostApiV1JobExecutionsByIdConsumedItemsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1JobExecutionsByIdConsumedItemsApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsRecordConsumedItemRequest: DomainEntitiesJobRequestsRecordConsumedItemRequest;
};
export type PostApiV1JobExecutionsCompleteApiResponse = void;
export type PostApiV1JobExecutionsCompleteApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsCompleteJobExecutionRequest: DomainEntitiesJobRequestsCompleteJobExecutionRequest;
};
export type PostApiV1JobExecutionsReassignApiResponse = void;
export type PostApiV1JobExecutionsReassignApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsReassignJobExecutionRequest: DomainEntitiesJobRequestsReassignJobExecutionRequest;
};
export type PostApiV1JobExecutionsVerifyApiResponse = void;
export type PostApiV1JobExecutionsVerifyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsVerifyJobExecutionRequest: DomainEntitiesJobRequestsVerifyJobExecutionRequest;
};
export type PostApiV1JobExecutionsApproveApiResponse = void;
export type PostApiV1JobExecutionsApproveApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsApproveJobExecutionRequest: DomainEntitiesJobRequestsApproveJobExecutionRequest;
};
export type PostApiV1ServiceMemosApiResponse =
  /** status 200 Service memo created successfully */ string;
export type PostApiV1ServiceMemosApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Service memo creation details */
  domainEntitiesJobRequestsCreateServiceMemoRequest: DomainEntitiesJobRequestsCreateServiceMemoRequest;
};
export type GetApiV1ServiceMemosApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsServiceMemoDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ServiceMemosApiArg = {
  page?: number;
  pageSize?: number;
  status?: DomainEntitiesJobRequestsServiceMemoStatus;
  jobOrderId?: string;
  serviceProviderId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ServiceMemosByIdApiResponse =
  /** status 200 OK */ DomainEntitiesJobRequestsServiceMemoDto;
export type GetApiV1ServiceMemosByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ServiceMemosByIdApiResponse = void;
export type PutApiV1ServiceMemosByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsUpdateServiceMemoRequest: DomainEntitiesJobRequestsUpdateServiceMemoRequest;
};
export type PutApiV1ServiceMemosPaidByIdApiResponse = void;
export type PutApiV1ServiceMemosPaidByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ServiceMemosIssueApiResponse = void;
export type PostApiV1ServiceMemosIssueApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Service memo ID to issue */
  domainEntitiesJobRequestsIssueServiceMemoRequest: DomainEntitiesJobRequestsIssueServiceMemoRequest;
};
export type PostApiV1ServiceProformaInvoicesRequestApiResponse =
  /** status 200 Proforma invoice requested successfully */ string;
export type PostApiV1ServiceProformaInvoicesRequestApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Proforma invoice request details */
  domainEntitiesJobRequestsRequestServiceProformaInvoiceRequest: DomainEntitiesJobRequestsRequestServiceProformaInvoiceRequest;
};
export type PostApiV1ServiceProformaInvoicesRespondApiResponse = void;
export type PostApiV1ServiceProformaInvoicesRespondApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Proforma invoice response details */
  domainEntitiesJobRequestsRespondServiceProformaInvoiceRequest: DomainEntitiesJobRequestsRespondServiceProformaInvoiceRequest;
};
export type PostApiV1ServiceProformaInvoicesApproveApiResponse = void;
export type PostApiV1ServiceProformaInvoicesApproveApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Approval details (approvedById is set automatically from authenticated user) */
  domainEntitiesJobRequestsApproveServiceProformaInvoiceRequest: DomainEntitiesJobRequestsApproveServiceProformaInvoiceRequest;
};
export type GetApiV1ServiceProformaInvoicesApiResponse =
  /** status 200 Returns paginated list of proforma invoices */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsServiceProformaInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ServiceProformaInvoicesApiArg = {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Filter by proforma invoice status */
  status?: DomainEntitiesJobRequestsServiceProformaInvoiceStatus;
  /** Filter by job order ID */
  jobOrderId?: string;
  /** Filter by service provider ID */
  serviceProviderId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ServiceProformaInvoicesByIdApiResponse =
  /** status 200 Returns proforma invoice details */ DomainEntitiesJobRequestsServiceProformaInvoiceDto;
export type GetApiV1ServiceProformaInvoicesByIdApiArg = {
  /** Proforma invoice unique identifier */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ServiceProvidersApiResponse =
  /** status 200 Service provider created successfully */ string;
export type PostApiV1ServiceProvidersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Service provider creation details */
  domainEntitiesServiceProvidersCreateServiceProviderRequest: DomainEntitiesServiceProvidersCreateServiceProviderRequest;
};
export type GetApiV1ServiceProvidersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesServiceProvidersServiceProviderReducedDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ServiceProvidersApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  serviceId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ServiceProvidersByIdApiResponse =
  /** status 200 OK */ DomainEntitiesServiceProvidersServiceProviderDto;
export type GetApiV1ServiceProvidersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ServiceProvidersByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesServiceProvidersServiceProviderDto;
export type PutApiV1ServiceProvidersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesServiceProvidersCreateServiceProviderRequest: DomainEntitiesServiceProvidersCreateServiceProviderRequest;
};
export type DeleteApiV1ServiceProvidersByIdApiResponse = void;
export type DeleteApiV1ServiceProvidersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ServiceProvidersServiceByServiceIdApiResponse =
  /** status 200 OK */ DomainEntitiesServiceProvidersServiceProviderDto;
export type GetApiV1ServiceProvidersServiceByServiceIdApiArg = {
  serviceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ServiceQuotationsApiResponse =
  /** status 200 Quotation created successfully */ string;
export type PostApiV1ServiceQuotationsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Quotation details */
  domainEntitiesJobRequestsCreateServiceQuotationRequest: DomainEntitiesJobRequestsCreateServiceQuotationRequest;
};
export type GetApiV1ServiceQuotationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsServiceQuotationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ServiceQuotationsApiArg = {
  page?: number;
  pageSize?: number;
  status?: DomainEntitiesJobRequestsQuotationStatus;
  jobOrderId?: string;
  serviceProviderId?: string;
  jobOrderStatus?: DomainEntitiesJobRequestsJobOrderStatus;
  proformaPending?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ServiceQuotationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesJobRequestsServiceQuotationDto;
export type GetApiV1ServiceQuotationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ServiceQuotationsByIdApiResponse = void;
export type PutApiV1ServiceQuotationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesJobRequestsUpdateServiceQuotationRequest: DomainEntitiesJobRequestsUpdateServiceQuotationRequest;
};
export type PostApiV1ServiceQuotationsNegotiateApiResponse = void;
export type PostApiV1ServiceQuotationsNegotiateApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Negotiation details */
  domainEntitiesJobRequestsNegotiateQuotationRequest: DomainEntitiesJobRequestsNegotiateQuotationRequest;
};
export type PostApiV1ServiceQuotationsCompareByJobOrderIdApiResponse =
  /** status 200 Returns list of quotations for comparison */ DomainEntitiesJobRequestsServiceQuotationDto[];
export type PostApiV1ServiceQuotationsCompareByJobOrderIdApiArg = {
  /** The job order id */
  jobOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ServicesApiResponse =
  /** status 200 Service created successfully */ string;
export type PostApiV1ServicesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** Service creation details */
  domainEntitiesServicesCreateServiceRequest: DomainEntitiesServicesCreateServiceRequest;
};
export type GetApiV1ServicesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesServicesServiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ServicesApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ServicesByIdApiResponse =
  /** status 200 OK */ DomainEntitiesServicesServiceDto;
export type GetApiV1ServicesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ServicesByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesServicesServiceDto;
export type PutApiV1ServicesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesServicesCreateServiceRequest: DomainEntitiesServicesCreateServiceRequest;
};
export type DeleteApiV1ServicesByIdApiResponse = void;
export type DeleteApiV1ServicesByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
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
export type DomainEntitiesTicketsTicketCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesTicketsTicketPriority = 0 | 1 | 2 | 3;
export type DomainEntitiesTicketsCreateTicketRequest = {
  title: string;
  description: string;
  category: DomainEntitiesTicketsTicketCategory;
  priority?: DomainEntitiesTicketsTicketPriority;
  siteId?: string | null;
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
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesTicketsTicketStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesSitesSiteDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesTicketsTicketDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  ticketNumber?: string | null;
  title?: string | null;
  description?: string | null;
  category?: DomainEntitiesTicketsTicketCategory;
  priority?: DomainEntitiesTicketsTicketPriority;
  status?: DomainEntitiesTicketsTicketStatus;
  reportedBy?: DomainEntitiesUsersUserDto;
  assignedTo?: DomainEntitiesUsersUserDto;
  assignedBy?: DomainEntitiesUsersUserDto;
  assignedAt?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
  site?: DomainEntitiesSitesSiteDto;
  dueDate?: string | null;
  doneAt?: string | null;
  doneBy?: DomainEntitiesUsersUserDto;
  closedAt?: string | null;
  closedBy?: DomainEntitiesUsersUserDto;
  reopenCount?: number;
};
export type DomainEntitiesTicketsTicketDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  ticketNumber?: string | null;
  title?: string | null;
  description?: string | null;
  category?: DomainEntitiesTicketsTicketCategory;
  priority?: DomainEntitiesTicketsTicketPriority;
  status?: DomainEntitiesTicketsTicketStatus;
  reportedBy?: DomainEntitiesUsersUserDto;
  assignedTo?: DomainEntitiesUsersUserDto;
  assignedBy?: DomainEntitiesUsersUserDto;
  assignedAt?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
  site?: DomainEntitiesSitesSiteDto;
  dueDate?: string | null;
  isOverdue?: boolean;
  doneAt?: string | null;
  doneBy?: DomainEntitiesUsersUserDto;
  closedAt?: string | null;
  closedBy?: DomainEntitiesUsersUserDto;
  reopenCount?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesTicketsTicketDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesTicketsTicketDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesTicketsTicketDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesTicketsTicketDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesTicketsAssignTicketRequest = {
  assignedToId: string;
};
export type DomainEntitiesTicketsReopenTicketRequest = {
  reason: string;
};
export type DomainEntitiesTicketsAddTicketCommentRequest = {
  comment: string;
};
export type DomainEntitiesTicketsTicketActivityType = 0 | 1 | 2 | 3;
export type DomainEntitiesTicketsTicketActivityDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  user?: DomainEntitiesUsersUserDto;
  type?: DomainEntitiesTicketsTicketActivityType;
  note?: string | null;
  oldStatus?: DomainEntitiesTicketsTicketStatus;
  newStatus?: DomainEntitiesTicketsTicketStatus;
};
export type DomainEntitiesJobRequestsCreateJobOrderRequest = {
  jobRequestId: string;
  serviceId?: string | null;
  issuedDate: string;
  issuedById: string;
  description?: string | null;
  issuedBySignature?: string | null;
  serviceProviderIds: string[];
};
export type DomainEntitiesServicesServiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  name?: string | null;
  code?: string | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  description?: string | null;
};
export type DomainEntitiesJobRequestsJobOrderStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesCurrenciesCurrencyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesServiceProvidersServiceProviderReducedDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
};
export type DomainEntitiesJobRequestsJobOrderServiceProviderDto = {
  id?: string;
  jobOrderId?: string;
  serviceProvider?: DomainEntitiesServiceProvidersServiceProviderReducedDto;
  sentAt?: string;
  responseReceived?: boolean;
  responseDate?: string | null;
};
export type DomainEntitiesItemsInventoryClassification = 0 | 1;
export type DomainEntitiesBaseUnitOfMeasureType = 0 | 1 | 2 | 3;
export type DomainEntitiesBaseUnitOfMeasureCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBaseUnitOfMeasureDto = {
  id?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
  createdAt?: string;
};
export type DomainEntitiesItemsStore = 0 | 1 | 2 | 3;
export type DomainEntitiesItemsItemCategoryDto = {
  id?: string;
  name?: string | null;
};
export type DomainEntitiesItemsItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  name?: string | null;
  code?: string | null;
  classification?: DomainEntitiesItemsInventoryClassification;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  hasBatch?: boolean;
  store?: DomainEntitiesItemsStore;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  isActive?: boolean;
  description?: string | null;
  itemCategory?: DomainEntitiesItemsItemCategoryDto;
  availableQuantity?: number;
};
export type DomainEntitiesJobRequestsQuotationItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  serviceQuotationId?: string;
  item?: DomainEntitiesItemsItemDto;
  quantity?: number;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  unitPrice?: number;
  priceUoM?: string | null;
  totalPrice?: number;
  negotiatedUnitPrice?: number | null;
  negotiatedTotalPrice?: number | null;
};
export type DomainEntitiesJobRequestsQuotationStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesJobRequestsServiceCharge = {
  name?: string | null;
  cost?: number;
};
export type DomainEntitiesJobRequestsServiceQuotationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  quotationNumber?: string | null;
  jobOrderId?: string;
  jobOrderStatus?: DomainEntitiesJobRequestsJobOrderStatus;
  service?: DomainEntitiesServicesServiceDto;
  serviceProvider?: DomainEntitiesServiceProvidersServiceProviderReducedDto;
  submittedDate?: string;
  serviceCharge?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  items?: DomainEntitiesJobRequestsQuotationItemDto[] | null;
  totalCost?: number;
  estimatedDays?: number;
  estimatedCompletionDate?: string;
  notes?: string | null;
  isSelected?: boolean;
  negotiatedServiceCharge?: number | null;
  negotiatedTotalCost?: number | null;
  negotiationNotes?: string | null;
  status?: DomainEntitiesJobRequestsQuotationStatus;
  totalServiceCharge?: number;
  totalItemCost?: number;
  grandTotal?: number;
  serviceCharges?: DomainEntitiesJobRequestsServiceCharge[] | null;
};
export type DomainEntitiesJobRequestsServiceQuotationReducedDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  quotationNumber?: string | null;
  jobOrderId?: string;
  service?: DomainEntitiesServicesServiceDto;
  serviceProvider?: SharedCollectionItemDto;
  submittedDate?: string;
  serviceCharge?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  totalCost?: number;
  estimatedDays?: number;
  estimatedCompletionDate?: string;
  notes?: string | null;
  isSelected?: boolean;
  negotiatedServiceCharge?: number | null;
  negotiatedTotalCost?: number | null;
  negotiationNotes?: string | null;
  status?: DomainEntitiesJobRequestsQuotationStatus;
  totalServiceCharge?: number;
  totalItemCost?: number;
  grandTotal?: number;
};
export type DomainEntitiesJobRequestsServiceProformaInvoiceItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  serviceProformaInvoiceId?: string;
  item?: DomainEntitiesItemsItemDto;
  quantity?: number;
  unitOfMeasureId?: string;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  unitPrice?: number;
  priceUoM?: string | null;
  totalPrice?: number;
};
export type DomainEntitiesJobRequestsServiceProformaInvoiceStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesJobRequestsServiceProformaInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  invoiceNumber?: string | null;
  jobOrder?: SharedCollectionItemDto;
  serviceQuotation?: DomainEntitiesJobRequestsServiceQuotationReducedDto;
  requestedDate?: string;
  requestedById?: string;
  responseReceivedDate?: string | null;
  notes?: string | null;
  items?: DomainEntitiesJobRequestsServiceProformaInvoiceItemDto[] | null;
  serviceCharge?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  totalCost?: number;
  status?: DomainEntitiesJobRequestsServiceProformaInvoiceStatus;
  responseNotes?: string | null;
  proformaInvoiceDocumentUrl?: string | null;
};
export type DomainEntitiesProductsEquipmentsEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  relevanceCheck?: boolean;
  department?: SharedCollectionItemDto;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesJobRequestsJobRequestStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type DomainEntitiesJobRequestsJobRequestReducedDto = {
  code?: string | null;
  site?: DomainEntitiesSitesSiteDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  equipmentInstrumentNumber?: string | null;
  dateOfIssue?: string;
  status?: DomainEntitiesJobRequestsJobRequestStatus;
  descriptionOfWork?: string | null;
  preferredCompletionDate?: string;
  item?: string | null;
  itemNumber?: string | null;
};
export type DomainEntitiesJobRequestsJobOrderReducedDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  jobRequest?: DomainEntitiesJobRequestsJobRequestReducedDto;
  service?: DomainEntitiesServicesServiceDto;
  issuedDate?: string;
  issuedBy?: DomainEntitiesUsersUserDto;
  description?: string | null;
  issuedBySignature?: string | null;
  status?: DomainEntitiesJobRequestsJobOrderStatus;
};
export type DomainEntitiesJobRequestsServiceMemoStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesJobRequestsServiceMemoDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  memoNumber?: string | null;
  jobOrder?: DomainEntitiesJobRequestsJobOrderReducedDto;
  serviceQuotation?: DomainEntitiesJobRequestsServiceQuotationDto;
  serviceProvider?: DomainEntitiesServiceProvidersServiceProviderReducedDto;
  issuedDate?: string;
  issuedBy?: DomainEntitiesUsersUserDto;
  agreedServiceCharge?: number;
  agreedMaterialsCost?: number;
  totalAgreedCost?: number;
  expectedStartDate?: string;
  expectedCompletionDate?: string;
  termsAndConditions?: string | null;
  specialInstructions?: string | null;
  status?: DomainEntitiesJobRequestsServiceMemoStatus;
  approved?: boolean;
  approvedDate?: string | null;
  paid?: boolean;
};
export type DomainEntitiesServiceProvidersServiceProviderDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  services?: DomainEntitiesServicesServiceDto[] | null;
};
export type DomainEntitiesJobRequestsJobOrderExecutionStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesJobRequestsJobActivityDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  jobExecutionId?: string | null;
  jobOrderExecutionId?: string | null;
  activityDescription?: string | null;
  performedAt?: string;
  performedBy?: DomainEntitiesUsersUserDto;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsItemSource = 0 | 1 | 2;
export type DomainEntitiesJobRequestsConsumedItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  jobExecutionId?: string | null;
  jobOrderExecutionId?: string | null;
  quotationItemId?: string | null;
  item?: DomainEntitiesItemsItemDto;
  quantityConsumed?: number;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  notes?: string | null;
  source?: DomainEntitiesJobRequestsItemSource;
};
export type DomainEntitiesJobRequestsJobOrderExecutionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  jobOrderId?: string;
  serviceProvider?: DomainEntitiesServiceProvidersServiceProviderDto;
  startedAt?: string;
  completedAt?: string | null;
  status?: DomainEntitiesJobRequestsJobOrderExecutionStatus;
  notes?: string | null;
  activities?: DomainEntitiesJobRequestsJobActivityDto[] | null;
  consumedItems?: DomainEntitiesJobRequestsConsumedItemDto[] | null;
  verifiedAt?: string | null;
  verifiedBy?: DomainEntitiesUsersUserDto;
  verificationComments?: string | null;
  approvedAt?: string | null;
  approvedBy?: DomainEntitiesUsersUserDto;
  approvalComments?: string | null;
  requesterSatisfied?: boolean;
  requesterComments?: string | null;
};
export type DomainEntitiesJobRequestsJobOrderDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  jobRequestId?: string;
  service?: DomainEntitiesServicesServiceDto;
  issuedDate?: string;
  issuedBy?: DomainEntitiesUsersUserDto;
  description?: string | null;
  issuedBySignature?: string | null;
  status?: DomainEntitiesJobRequestsJobOrderStatus;
  serviceProviders?:
    DomainEntitiesJobRequestsJobOrderServiceProviderDto[] | null;
  quotations?: DomainEntitiesJobRequestsServiceQuotationDto[] | null;
  selectedQuotationId?: string | null;
  selectedQuotation?: DomainEntitiesJobRequestsServiceQuotationDto;
  serviceProformaInvoiceId?: string | null;
  serviceProformaInvoice?: DomainEntitiesJobRequestsServiceProformaInvoiceDto;
  serviceMemo?: DomainEntitiesJobRequestsServiceMemoDto;
  execution?: DomainEntitiesJobRequestsJobOrderExecutionDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsJobOrderDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobOrderServiceProviderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsJobOrderServiceProviderDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesJobRequestsSendJobOrderToProvidersRequest = {
  jobOrderId: string;
  serviceProviderIds: string[];
};
export type DomainEntitiesJobRequestsSelectQuotationRequest = {
  jobOrderId: string;
  quotationId: string;
};
export type DomainEntitiesJobRequestsStartJobOrderExecutionRequest = {
  jobOrderId: string;
  serviceProviderId: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsRecordJobActivityRequest = {
  activityDescription: string;
  performedAt: string;
  performedById: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsRecordConsumedItemRequest = {
  itemId: string;
  quantityConsumed: number;
  unitOfMeasureId: string;
  notes?: string | null;
  source?: DomainEntitiesJobRequestsItemSource;
};
export type DomainEntitiesJobRequestsCompleteJobOrderExecutionRequest = {
  jobOrderExecutionId: string;
  notes?: string | null;
  activities?: DomainEntitiesJobRequestsRecordJobActivityRequest[] | null;
  consumedItems?: DomainEntitiesJobRequestsRecordConsumedItemRequest[] | null;
};
export type DomainEntitiesJobRequestsVerifyJobOrderExecutionRequest = {
  jobOrderExecutionId: string;
  verifiedById: string;
  verificationComments?: string | null;
};
export type DomainEntitiesJobRequestsApproveJobOrderExecutionRequest = {
  jobOrderExecutionId: string;
  approvedById: string;
  approvalComments?: string | null;
  requesterSatisfied?: boolean;
  requesterComments?: string | null;
};
export type DomainEntitiesJobRequestsCreateJobRequest = {
  code?: string | null;
  siteId?: string | null;
  equipmentId?: string | null;
  equipmentInstrumentNumber?: string | null;
  dateOfIssue: string;
  descriptionOfWork: string;
  preferredCompletionDate: string;
  item?: string | null;
  itemNumber?: string | null;
  serviceId?: string | null;
};
export type DomainEntitiesJobRequestsJobHandlingType = 0 | 1 | 2;
export type DomainEntitiesEmployeesGender = 0 | 1;
export type DomainEntitiesEmployeesMaritalStatus = 0 | 1;
export type DomainEntitiesEmployeesReligion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DomainEntitiesEmployeesEmployeeType = 0 | 1;
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
export type DomainEntitiesJobRequestsJobRequestDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  code?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
  site?: DomainEntitiesSitesSiteDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  equipmentInstrumentNumber?: string | null;
  dateOfIssue?: string;
  status?: DomainEntitiesJobRequestsJobRequestStatus;
  descriptionOfWork?: string | null;
  preferredCompletionDate?: string;
  item?: string | null;
  itemNumber?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  handlingType?: DomainEntitiesJobRequestsJobHandlingType;
  assignedToEmployee?: DomainEntitiesEmployeesEmployeeDto;
  assignedAt?: string | null;
  assignedBy?: DomainEntitiesUsersUserDto;
  service?: DomainEntitiesServicesServiceDto;
  approved?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsJobRequestDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesJobRequestsUpdateJobRequestRequest = {
  code?: string | null;
  siteId?: string | null;
  equipmentId?: string | null;
  equipmentInstrumentNumber?: string | null;
  descriptionOfWork?: string | null;
  preferredCompletionDate?: string | null;
  item?: string | null;
  itemNumber?: string | null;
  serviceId?: string | null;
};
export type DomainEntitiesJobRequestsAssignInternalJobRequest = {
  jobRequestId: string;
  assignedToEmployeeId: string;
  assignedById: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsUpdateJobRequestStatusRequest = {
  status: DomainEntitiesJobRequestsJobRequestStatus;
};
export type DomainEntitiesJobRequestsCompleteJobRequestRequest = {
  jobRequestId: string;
  activityPerformedNote: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsJobExecutionStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesJobRequestsJobExecutionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  jobRequestId?: string;
  assignedToEmployee?: DomainEntitiesEmployeesEmployeeDto;
  assignedAt?: string;
  assignedBy?: DomainEntitiesUsersUserDto;
  acknowledgedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: DomainEntitiesJobRequestsJobExecutionStatus;
  notes?: string | null;
  activities?: DomainEntitiesJobRequestsJobActivityDto[] | null;
  consumedItems?: DomainEntitiesJobRequestsConsumedItemDto[] | null;
  verifiedAt?: string | null;
  verifiedBy?: DomainEntitiesUsersUserDto;
  verificationComments?: string | null;
  approvedAt?: string | null;
  approvedBy?: DomainEntitiesUsersUserDto;
  approvalComments?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsJobExecutionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsJobExecutionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesJobRequestsAcknowledgeJobExecutionRequest = {
  jobExecutionId: string;
};
export type DomainEntitiesJobRequestsStartJobExecutionRequest = {
  jobExecutionId: string;
  activityDescription: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsCompleteJobExecutionRequest = {
  jobExecutionId: string;
  activityDescription: string;
  notes?: string | null;
  additionalActivities?:
    DomainEntitiesJobRequestsRecordJobActivityRequest[] | null;
  consumedItems?: DomainEntitiesJobRequestsRecordConsumedItemRequest[] | null;
};
export type DomainEntitiesJobRequestsReassignJobExecutionRequest = {
  jobExecutionId: string;
  newEmployeeId: string;
  reason: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsVerifyJobExecutionRequest = {
  jobExecutionId: string;
  verifiedById: string;
  verificationComments?: string | null;
};
export type DomainEntitiesJobRequestsApproveJobExecutionRequest = {
  jobExecutionId: string;
  approvedById: string;
  approvalComments?: string | null;
};
export type DomainEntitiesJobRequestsCreateServiceMemoRequest = {
  jobOrderId: string;
  serviceQuotationId: string;
  serviceProviderId: string;
  issuedDate: string;
  issuedById: string;
  agreedServiceCharge: number;
  agreedMaterialsCost: number;
  expectedStartDate: string;
  expectedCompletionDate: string;
  termsAndConditions?: string | null;
  specialInstructions?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsServiceMemoDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsServiceMemoDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesJobRequestsUpdateServiceMemoRequest = {
  agreedServiceCharge?: number | null;
  agreedMaterialsCost?: number | null;
  expectedStartDate?: string | null;
  expectedCompletionDate?: string | null;
  termsAndConditions?: string | null;
  specialInstructions?: string | null;
};
export type DomainEntitiesJobRequestsIssueServiceMemoRequest = {
  serviceMemoId: string;
};
export type DomainEntitiesJobRequestsRequestServiceProformaInvoiceRequest = {
  jobOrderId: string;
  serviceQuotationId: string;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsUpdateProformaInvoiceItemRequest = {
  serviceProformaInvoiceItemId: string;
  unitPrice?: number | null;
  quantity?: number | null;
};
export type DomainEntitiesJobRequestsRespondServiceProformaInvoiceRequest = {
  serviceProformaInvoiceId: string;
  invoiceNumber?: string | null;
  responseDate: string;
  responseNotes?: string | null;
  proformaInvoiceDocumentUrl?: string | null;
  updatedItems?:
    DomainEntitiesJobRequestsUpdateProformaInvoiceItemRequest[] | null;
};
export type DomainEntitiesJobRequestsApproveServiceProformaInvoiceRequest = {
  serviceProformaInvoiceId: string;
  approvedById: string;
  approvalComments?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsServiceProformaInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsServiceProformaInvoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesServiceProvidersCreateServiceProviderRequest = {
  name: string;
  address: string;
  phone: string;
  email: string;
  countryId: string;
  currencyId: string;
  serviceIds: string[];
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesServiceProvidersServiceProviderReducedDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesServiceProvidersServiceProviderReducedDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesJobRequestsCreateServiceCharge = {
  name?: string | null;
  cost?: number;
};
export type DomainEntitiesJobRequestsCreateQuotationItemRequest = {
  itemId?: string | null;
  quantity: number;
  unitOfMeasureId: string;
  unitPrice: number;
};
export type DomainEntitiesJobRequestsCreateServiceQuotationRequest = {
  jobOrderId: string;
  serviceProviderId: string;
  quotationNumber?: string | null;
  submittedDate: string;
  serviceCharges?: DomainEntitiesJobRequestsCreateServiceCharge[] | null;
  currencyId: string;
  estimatedDays: number;
  estimatedCompletionDate: string;
  notes?: string | null;
  items?: DomainEntitiesJobRequestsCreateQuotationItemRequest[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesJobRequestsServiceQuotationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesJobRequestsServiceQuotationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesJobRequestsUpdateServiceQuotationRequest = {
  serviceCharge?: number | null;
  estimatedDays?: number | null;
  estimatedCompletionDate?: string | null;
  notes?: string | null;
};
export type DomainEntitiesJobRequestsNegotiateQuotationItemRequest = {
  quotationItemId: string;
  negotiatedUnitPrice?: number;
};
export type DomainEntitiesJobRequestsNegotiateQuotationRequest = {
  quotationId: string;
  negotiatedServiceCharge?: number | null;
  negotiatedItems?:
    DomainEntitiesJobRequestsNegotiateQuotationItemRequest[] | null;
  negotiationNotes?: string | null;
};
export type DomainEntitiesServicesCreateServiceRequest = {
  name: string;
  code?: string | null;
  startDate: string;
  endDate: string;
  description?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesServicesServiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesServicesServiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export const {
  usePostApiV1TicketsMutation,
  useGetApiV1TicketsQuery,
  useLazyGetApiV1TicketsQuery,
  useGetApiV1TicketsByIdQuery,
  useLazyGetApiV1TicketsByIdQuery,
  usePutApiV1TicketsByIdAssignMutation,
  usePutApiV1TicketsByIdStartMutation,
  usePutApiV1TicketsByIdDoneMutation,
  usePutApiV1TicketsByIdCloseMutation,
  usePutApiV1TicketsByIdReopenMutation,
  usePostApiV1TicketsByIdCommentsMutation,
  useGetApiV1TicketsByIdActivityQuery,
  useLazyGetApiV1TicketsByIdActivityQuery,
  usePostApiV1JobOrdersMutation,
  useGetApiV1JobOrdersQuery,
  useLazyGetApiV1JobOrdersQuery,
  useGetApiV1JobOrdersByIdQuery,
  useLazyGetApiV1JobOrdersByIdQuery,
  useGetApiV1JobOrdersServiceProvidersQuery,
  useLazyGetApiV1JobOrdersServiceProvidersQuery,
  usePostApiV1JobOrdersSendToProvidersMutation,
  usePostApiV1JobOrdersSelectQuotationMutation,
  usePostApiV1JobOrdersStartExecutionMutation,
  usePostApiV1JobOrdersExecutionsByIdActivitiesMutation,
  usePostApiV1JobOrdersExecutionsByIdConsumedItemsMutation,
  usePostApiV1JobOrdersCompleteExecutionMutation,
  usePostApiV1JobOrdersVerifyExecutionMutation,
  usePostApiV1JobOrdersApproveExecutionMutation,
  usePostApiV1JobRequestsMutation,
  useGetApiV1JobRequestsQuery,
  useLazyGetApiV1JobRequestsQuery,
  useGetApiV1JobRequestsByIdQuery,
  useLazyGetApiV1JobRequestsByIdQuery,
  usePutApiV1JobRequestsByIdMutation,
  useDeleteApiV1JobRequestsByIdMutation,
  useGetApiV1JobRequestsOrdersQuery,
  useLazyGetApiV1JobRequestsOrdersQuery,
  usePostApiV1JobRequestsAssignInternalMutation,
  usePutApiV1JobRequestsStatusByIdMutation,
  useGetApiV1JobRequestsCompletedInternalQuery,
  useLazyGetApiV1JobRequestsCompletedInternalQuery,
  usePostApiV1JobRequestsCompleteMutation,
  useGetApiV1JobExecutionsQuery,
  useLazyGetApiV1JobExecutionsQuery,
  useGetApiV1JobExecutionsByIdQuery,
  useLazyGetApiV1JobExecutionsByIdQuery,
  usePostApiV1JobExecutionsAcknowledgeMutation,
  usePostApiV1JobExecutionsStartMutation,
  usePostApiV1JobExecutionsByIdActivitiesMutation,
  usePostApiV1JobExecutionsByIdConsumedItemsMutation,
  usePostApiV1JobExecutionsCompleteMutation,
  usePostApiV1JobExecutionsReassignMutation,
  usePostApiV1JobExecutionsVerifyMutation,
  usePostApiV1JobExecutionsApproveMutation,
  usePostApiV1ServiceMemosMutation,
  useGetApiV1ServiceMemosQuery,
  useLazyGetApiV1ServiceMemosQuery,
  useGetApiV1ServiceMemosByIdQuery,
  useLazyGetApiV1ServiceMemosByIdQuery,
  usePutApiV1ServiceMemosByIdMutation,
  usePutApiV1ServiceMemosPaidByIdMutation,
  usePostApiV1ServiceMemosIssueMutation,
  usePostApiV1ServiceProformaInvoicesRequestMutation,
  usePostApiV1ServiceProformaInvoicesRespondMutation,
  usePostApiV1ServiceProformaInvoicesApproveMutation,
  useGetApiV1ServiceProformaInvoicesQuery,
  useLazyGetApiV1ServiceProformaInvoicesQuery,
  useGetApiV1ServiceProformaInvoicesByIdQuery,
  useLazyGetApiV1ServiceProformaInvoicesByIdQuery,
  usePostApiV1ServiceProvidersMutation,
  useGetApiV1ServiceProvidersQuery,
  useLazyGetApiV1ServiceProvidersQuery,
  useGetApiV1ServiceProvidersByIdQuery,
  useLazyGetApiV1ServiceProvidersByIdQuery,
  usePutApiV1ServiceProvidersByIdMutation,
  useDeleteApiV1ServiceProvidersByIdMutation,
  useGetApiV1ServiceProvidersServiceByServiceIdQuery,
  useLazyGetApiV1ServiceProvidersServiceByServiceIdQuery,
  usePostApiV1ServiceQuotationsMutation,
  useGetApiV1ServiceQuotationsQuery,
  useLazyGetApiV1ServiceQuotationsQuery,
  useGetApiV1ServiceQuotationsByIdQuery,
  useLazyGetApiV1ServiceQuotationsByIdQuery,
  usePutApiV1ServiceQuotationsByIdMutation,
  usePostApiV1ServiceQuotationsNegotiateMutation,
  usePostApiV1ServiceQuotationsCompareByJobOrderIdMutation,
  usePostApiV1ServicesMutation,
  useGetApiV1ServicesQuery,
  useLazyGetApiV1ServicesQuery,
  useGetApiV1ServicesByIdQuery,
  useLazyGetApiV1ServicesByIdQuery,
  usePutApiV1ServicesByIdMutation,
  useDeleteApiV1ServicesByIdMutation,
} = injectedRtkApi;
