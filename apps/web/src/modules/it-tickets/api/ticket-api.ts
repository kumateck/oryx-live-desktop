import { identityApi } from "@/shared/api/generated/identity";
import { servicesApi } from "@/shared/api/generated/services";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "Tickets" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];

export const ticketApi = servicesApi.enhanceEndpoints({
  endpoints: {
    getApiV1Tickets: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1TicketsById: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1TicketsByIdActivity: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    postApiV1Tickets: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, putApiV1TicketsByIdAssign: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, putApiV1TicketsByIdStart: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, putApiV1TicketsByIdDone: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1TicketsByIdClose: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, putApiV1TicketsByIdReopen: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, postApiV1TicketsByIdComments: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  },
});
export const { useGetApiV1TicketsQuery, useGetApiV1TicketsByIdQuery, useGetApiV1TicketsByIdActivityQuery, usePostApiV1TicketsMutation, usePutApiV1TicketsByIdAssignMutation, usePutApiV1TicketsByIdStartMutation,
  usePutApiV1TicketsByIdDoneMutation, usePutApiV1TicketsByIdCloseMutation, usePutApiV1TicketsByIdReopenMutation, usePostApiV1TicketsByIdCommentsMutation } = ticketApi;
export const { useLazyGetApiV1UserByPermissionQuery } = identityApi;
