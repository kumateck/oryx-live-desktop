import { z } from "zod";
import { settingsApi } from "@/shared/api/generated/settings";
import { addTags } from "@/shared/api/add-tags";

const unread = { type: "Notifications" as const, id: "unread" };
const all = { type: "Notifications" as const, id: "all" };
export const notificationAudit = { module: "Notifications", subModule: "In-app" } as const;

export const notificationApi = settingsApi.enhanceEndpoints({
  endpoints: {
    getApiV1AlertNotifications: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [arg.unreadOnly ? unread : all]); },
    // The unread list is corrected in place when one is marked read; the full list is read again.
    putApiV1AlertByIdMarkAsRead: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [all]); },
  },
});
export const { useGetApiV1AlertNotificationsQuery, usePutApiV1AlertByIdMarkAsReadMutation } = notificationApi;
export const unreadArg = { ...notificationAudit, unreadOnly: true } as const;
export const unreadTag = unread;

const text = z.string().nullish().transform((value) => value?.trim() || null);
/** The user's persisted notifications, with server occurrence time when present and valid. */
export const notificationListSchema = z.array(z.object({ id: z.string().nullish(), message: text, type: z.number().nullish(), priority: z.string().nullish().catch(null), shipmentDocumentId: z.string().uuid().nullish().catch(null), sentAt: z.string().datetime({ offset: true }).nullish().catch(null) })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id && entry.message ? [{ id: entry.id, message: entry.message, type: entry.type ?? null, ...(entry.sentAt ? { sentAt: entry.sentAt } : {}), ...(entry.priority ? { priority: entry.priority } : {}), ...(entry.shipmentDocumentId ? { shipmentDocumentId: entry.shipmentDocumentId } : {}) }] : []));
