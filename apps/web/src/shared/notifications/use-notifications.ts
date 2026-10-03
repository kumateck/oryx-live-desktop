import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { api } from "@/shared/api/base-api";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { tokenStore } from "@/shared/auth/token-store";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { announce, announceMany } from "./announce";
import { arrivalSummary, createAnnouncedLog, newArrivals, type Unread } from "./arrivals";
import { connectLive } from "./live-connection";
import { notificationApi, notificationAudit, notificationListSchema, unreadArg, unreadTag, useGetApiV1AlertNotificationsQuery, usePutApiV1AlertByIdMarkAsReadMutation } from "./notification-api";

/** With the live connection up, the list is still read now and then in case a push was missed; without it, every minute. */
const liveCheckMs = 5 * 60_000;
const fallbackCheckMs = 60_000;
/** The server publishes a notification just before it saves it, so the list is read a moment after a push, and once more. */
const afterPushMs = [1_500, 6_000];

/**
 * The signed-in user's notifications: the unread list from the server, kept current by the live connection
 * and by a timer, with each new arrival announced once. `onOpen` is called when the user asks to see them.
 */
export function useNotifications(onOpen: () => void) {
  const user = useCurrentUser();
  const dispatch = useDispatch();
  const [live, setLive] = useState(false);
  const query = useGetApiV1AlertNotificationsQuery(unreadArg, { pollingInterval: live ? liveCheckMs : fallbackCheckMs, refetchOnFocus: true, refetchOnReconnect: true, skip: !user });
  const [markRead] = usePutApiV1AlertByIdMarkAsReadMutation();
  const unread = useMemo((): Unread[] => { const parsed = notificationListSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  /** When each was received in this session, by its text; the server does not say when it was sent. */
  const [receivedAt, setReceivedAt] = useState<ReadonlyMap<string, string>>(new Map());
  const open = useRef(onOpen);
  useEffect(() => { open.current = onOpen; });
  const [log] = useState(() => createAnnouncedLog());
  const refetch = query.refetch;

  // The live connection: a push is announced at once, then the list is read so the bell agrees with the server.
  useEffect(() => {
    if (!user) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const close = connectLive(() => tokenStore.accessToken(), {
      onState: setLive,
      onNotification: (pushed) => {
        setReceivedAt((current) => new Map(current).set(pushed.message, pushed.sentAt ?? new Date().toISOString()));
        if (log.claim(pushed.message)) announce(pushed, () => open.current());
        for (const wait of afterPushMs) { const timer = setTimeout(() => { timers.delete(timer); void refetch(); }, wait); timers.add(timer); }
      },
      // A production run changed somewhere; the pages that show runs read theirs again.
      onActivity: () => { dispatch(api.util.invalidateTags(["ActivityBoard", "Activity"])); },
    });
    return () => { for (const timer of timers) clearTimeout(timer); close(); setLive(false); };
  }, [user, dispatch, log, refetch]);

  // Anything in the list that was not there last time is new, however it got there.
  const known = useRef<{ user: string | null; ids: Set<string> | null }>({ user: null, ids: null });
  useEffect(() => {
    const userId = user?.id ?? null;
    if (known.current.user !== userId) known.current = { user: userId, ids: null };
    if (!query.isSuccess || query.isFetching) return;
    const fresh = newArrivals(known.current.ids, unread).filter((item) => log.claim(item.message));
    known.current.ids = new Set(unread.map((item) => item.id));
    if (fresh.length === 0) return;
    const now = new Date().toISOString();
    setReceivedAt((current) => { const next = new Map(current); for (const item of fresh) if (!next.has(item.message)) next.set(item.message, now); return next; });
    if (arrivalSummary(fresh.length)) announceMany(fresh.length, () => open.current());
    else for (const item of fresh) announce(item, () => open.current());
  }, [unread, query.isSuccess, query.isFetching, user?.id, log]);

  /** Marks one as read. It leaves the list at once and comes back if the server refuses. */
  const read = useCallback(async (id: string): Promise<string | null> => {
    const patch = dispatch(notificationApi.util.updateQueryData("getApiV1AlertNotifications", unreadArg, (draft) => { const index = draft.findIndex((item) => item.id === id); if (index >= 0) draft.splice(index, 1); }) as never) as unknown as { undo: () => void };
    const result = await markRead({ ...notificationAudit, id });
    if (!("error" in result)) return null;
    const reason = apiErrorMessage(result.error);
    // Read already, here or in another window: that is what was wanted.
    if (/already read/i.test(reason)) return null;
    patch.undo();
    return reason;
  }, [dispatch, markRead]);

  /** Marks every unread one as read, one request after another, stopping at the first the server refuses. */
  const readAll = useCallback(async (): Promise<{ done: number; failed: string | null }> => {
    let done = 0;
    for (const item of unread) {
      const failure = await read(item.id);
      if (failure) { dispatch(api.util.invalidateTags([unreadTag])); return { done, failed: failure }; }
      done += 1;
    }
    return { done, failed: null };
  }, [unread, read, dispatch]);

  return { unread, receivedAt, live, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void refetch(); }, read, readAll };
}
