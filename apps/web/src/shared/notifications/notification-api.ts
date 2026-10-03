import { z } from "zod";
import { settingsApi } from "@/shared/api/generated/settings";

const unread = { type: "Notifications" as const, id: "unread" };
const all = { type: "Notifications" as const, id: "all" };
export const notificationAudit = { module: "Notifications", subModule: "In-app" } as const;

export const notificationApi = settingsApi.enhanceEndpoints({
  endpoints: {
    getApiV1AlertNotifications: { providesTags: (_result, _error, arg) => [arg.unreadOnly ? unread : all] },
    // The unread list is corrected in place when one is marked read; the full list is read again.
    putApiV1AlertByIdMarkAsRead: { invalidatesTags: (_result, error) => error ? [] : [all] },
  },
});
export const { useGetApiV1AlertNotificationsQuery, usePutApiV1AlertByIdMarkAsReadMutation } = notificationApi;
export const unreadArg = { ...notificationAudit, unreadOnly: true } as const;
export const unreadTag = unread;

const text = z.string().nullish().transform((value) => value?.trim() || null);
/**
 * The user's notifications, newest first. The server does not send when each was sent (it fills the field
 * with the time of the request), so no time is read from it.
 */
export const notificationListSchema = z.array(z.object({ id: z.string().nullish(), message: text, type: z.number().nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id && entry.message ? [{ id: entry.id, message: entry.message, type: entry.type ?? null }] : []));
