import { io } from "socket.io-client";

export interface PushedNotification { id?: string; message: string; type: number | null; sentAt: string | null; priority?: string; shipmentDocumentId?: string }
export interface ActivityUpdate { activityId: string }
export interface LiveHandlers { onNotification: (notification: PushedNotification) => void; onActivity: (update: ActivityUpdate) => void; onState: (connected: boolean) => void; onRead?: (notificationId?: string) => void }

/** The notification gateway is served from the same origin as the app, beside the API. */
export const livePath = "/realtime/socket.io";
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  socket.on("delivery-state", (payload: object) => {
    if (payload && typeof payload === "object" && "connected" in payload && typeof payload.connected === "boolean") handlers.onState(payload.connected);
  });
  socket.on("disconnect", () => handlers.onState(false));
  socket.on("connect_error", () => handlers.onState(false));
  socket.on("notification-read", (payload: unknown) => {
    const id = (payload as { notificationId?: unknown } | null)?.notificationId;
    handlers.onRead?.(typeof id === "string" && guid.test(id) ? id.toLowerCase() : undefined);
  });
  socket.on("notification", (payload: unknown) => {
    const body = payload as { priority?: unknown; id?: unknown; message?: unknown; type?: unknown; sentAt?: unknown; shipmentDocumentId?: unknown } | null;
    if (typeof body?.message !== "string" || !body.message.trim()) return;
    handlers.onNotification({ ...(typeof body.priority === "string" && body.priority.length <= 32 ? { priority: body.priority } : {}), ...(typeof body.id === "string" && body.id.trim() ? { id: body.id.trim() } : {}), ...(typeof body.shipmentDocumentId === "string" && guid.test(body.shipmentDocumentId) ? { shipmentDocumentId: body.shipmentDocumentId.toLowerCase() } : {}), message: body.message.trim(), type: typeof body.type === "number" ? body.type : null, sentAt: typeof body.sentAt === "string" ? body.sentAt : null });
  });
  socket.on("activity-updated", (payload: unknown) => {
    const id = (payload as { activityId?: unknown } | null)?.activityId;
    if (typeof id === "string" && id) handlers.onActivity({ activityId: id });
  });
  return () => { socket.removeAllListeners(); socket.disconnect(); };
}
