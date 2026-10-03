import { identityApi } from "@/shared/api/generated/identity";
import { servicesApi } from "@/shared/api/generated/services";

const list = { type: "Tickets" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];

export const ticketApi = servicesApi.enhanceEndpoints({
  endpoints: {
    getApiV1Tickets: { providesTags: [list] }, getApiV1TicketsById: { providesTags: [list] }, getApiV1TicketsByIdActivity: { providesTags: [list] },
    postApiV1Tickets: { invalidatesTags: changed }, putApiV1TicketsByIdAssign: { invalidatesTags: changed }, putApiV1TicketsByIdStart: { invalidatesTags: changed }, putApiV1TicketsByIdDone: { invalidatesTags: changed },
    putApiV1TicketsByIdClose: { invalidatesTags: changed }, putApiV1TicketsByIdReopen: { invalidatesTags: changed }, postApiV1TicketsByIdComments: { invalidatesTags: changed },
  },
});
export const { useGetApiV1TicketsQuery, useGetApiV1TicketsByIdQuery, useGetApiV1TicketsByIdActivityQuery, usePostApiV1TicketsMutation, usePutApiV1TicketsByIdAssignMutation, usePutApiV1TicketsByIdStartMutation,
  usePutApiV1TicketsByIdDoneMutation, usePutApiV1TicketsByIdCloseMutation, usePutApiV1TicketsByIdReopenMutation, usePostApiV1TicketsByIdCommentsMutation } = ticketApi;
export const { useLazyGetApiV1UserByPermissionQuery } = identityApi;
