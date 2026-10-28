/** The exchanges the .NET backend publishes to. Both are fan-out, so every queue bound to them gets every message. */
export const notificationExchange = "DOMAIN.Entities.Notifications:NotificationDto";
export const boardExchange = "DOMAIN.Entities.ProductionSchedules:ProductionActivityStepStatusChangedEvent";

/** What a client is told about a notification. The list of recipients stays on the server. */
export interface ClientNotification { id?: string; message: string; type: number | null; sentAt: string | null; priority?: string; shipmentDocumentId?: string }
export interface RoutedNotification { recipients: string[]; payload: ClientNotification }
/** A step of a production run changed. Carries identifiers only; clients read the details from the backend. */
export interface BoardUpdate { activityId: string; stepId: string | null; status: number | null; changedAt: string | null }

const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const record = (value: unknown): Record<string, unknown> | null => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The body of a broker message. The backend wraps what it publishes in an envelope whose `message` is the content. */
function content(raw: Buffer | string): Record<string, unknown> | null {
  let parsed: unknown;
  try { parsed = JSON.parse(typeof raw === "string" ? raw : raw.toString("utf8")); } catch { return null; }
  const envelope = record(parsed);
  return envelope ? record(envelope.message) ?? envelope : null;
}

/**
 * Reads a published notification: its text and who it is for. A notification with no readable recipient
 * is dropped rather than sent to everyone.
 */
export function readNotification(raw: Buffer | string): RoutedNotification | null {
  const body = content(raw);
  const message = text(body?.message);
  if (!body || !message) return null;
  const list = Array.isArray(body.recipients) ? body.recipients : [];
  const recipients = [...new Set(list.flatMap((entry): string[] => {
    const id = typeof entry === "string" ? entry : text(record(entry)?.id);
    return id && guid.test(id) ? [id.toLowerCase()] : [];
  }))];
  if (recipients.length === 0) return null;
  return { recipients, payload: { ...(typeof body.priority === "string" && body.priority.length <= 32 ? { priority: body.priority } : {}), ...(typeof body.id === "string" && guid.test(body.id) ? { id: body.id.toLowerCase() } : {}), ...(typeof body.shipmentDocumentId === "string" && guid.test(body.shipmentDocumentId) ? { shipmentDocumentId: body.shipmentDocumentId.toLowerCase() } : {}), message, type: typeof body.type === "number" ? body.type : null, sentAt: text(body.sentAt) } };
}

export function readBoardUpdate(raw: Buffer | string): BoardUpdate | null {
  const body = content(raw);
  const activityId = text(body?.productionActivityId);
  if (!body || !activityId || !guid.test(activityId)) return null;
  return { activityId: activityId.toLowerCase(), stepId: text(body.productionActivityStepId), status: typeof body.status === "number" ? body.status : null, changedAt: text(body.changedAt) };
}

/** The room every socket of one user joins. */
export const userRoom = (userId: string) => `user:${userId.toLowerCase()}`;
/** The room of every signed-in socket, for updates that are not addressed to anyone in particular. */
export const everyoneRoom = "signed-in";

export const notificationReadExchange = "DOMAIN.Entities.Notifications:NotificationReadEvent";
export interface ReadUpdate { userId: string; notificationId: string }
export function readNotificationRead(raw: Buffer | string): ReadUpdate | null {
  const body = content(raw), userId = text(body?.userId), notificationId = text(body?.notificationId);
  return userId && notificationId && guid.test(userId) && guid.test(notificationId)
    ? { userId: userId.toLowerCase(), notificationId: notificationId.toLowerCase() } : null;
}
