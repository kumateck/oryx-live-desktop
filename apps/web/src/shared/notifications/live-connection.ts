import { io } from "socket.io-client";

export interface PushedNotification { message: string; type: number | null; sentAt: string | null }
export interface ActivityUpdate { activityId: string }
export interface LiveHandlers { onNotification: (notification: PushedNotification) => void; onActivity: (update: ActivityUpdate) => void; onState: (connected: boolean) => void }

/** The notification gateway is served from the same origin as the app, beside the API. */
export const livePath = "/realtime/socket.io";

/**
 * Opens the live connection to the notification gateway. The token is sent in the handshake, read afresh
 * on every attempt, so a reconnect after the session was renewed carries the new one. The connection
 * retries by itself with a growing wait; while it is down the app checks for notifications on a timer.
 * Returns the function that closes it.
 */
export function connectLive(getToken: () => string | null, handlers: LiveHandlers): () => void {
  const socket = io({ path: livePath, transports: ["websocket", "polling"], auth: (send) => send({ token: getToken() ?? "" }),
    reconnection: true, reconnectionDelay: 2_000, reconnectionDelayMax: 60_000, randomizationFactor: 0.5 });
  socket.on("connect", () => handlers.onState(true));
  socket.on("disconnect", () => handlers.onState(false));
  socket.on("connect_error", () => handlers.onState(false));
  socket.on("notification", (payload: unknown) => {
    const body = payload as { message?: unknown; type?: unknown; sentAt?: unknown } | null;
    if (typeof body?.message !== "string" || !body.message.trim()) return;
    handlers.onNotification({ message: body.message.trim(), type: typeof body.type === "number" ? body.type : null, sentAt: typeof body.sentAt === "string" ? body.sentAt : null });
  });
  socket.on("activity-updated", (payload: unknown) => {
    const id = (payload as { activityId?: unknown } | null)?.activityId;
    if (typeof id === "string" && id) handlers.onActivity({ activityId: id });
  });
  return () => { socket.removeAllListeners(); socket.disconnect(); };
}
