export interface Point { x: number; y: number }
export interface Area extends Point { width: number; height: number }
export const companionSize = 176;
export const companionPanelHeight = (alertCount: number) => Math.min(200, Math.max(80, 42 + Math.max(1, alertCount) * 48));
export const companionHeight = 376;
export function clampPlacement(point: Point, area: Area, height = companionHeight): Point {
  return {
    x: Math.round(Math.max(area.x, Math.min(point.x, area.x + Math.max(0, area.width - companionSize)))),
    y: Math.round(Math.max(area.y, Math.min(point.y, area.y + Math.max(0, area.height - height)))),
  };
}
function validAlert(value: object): boolean {
  return "label" in value && typeof value.label === "string" && value.label.trim().length > 0 && value.label.length <= 80
    && "message" in value && typeof value.message === "string" && value.message.trim().length > 0 && value.message.length <= 4000
    && "id" in value && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 100
    && "type" in value && (value.type === null || (typeof value.type === "number" && Number.isInteger(value.type)))
    && "priority" in value && typeof value.priority === "number" && Number.isInteger(value.priority) && value.priority >= 0 && value.priority <= 4
    && (!("shipmentDocumentId" in value) || (typeof value.shipmentDocumentId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.shipmentDocumentId)));
}
export function validSummary(value: object): value is import("./contract.js").CompanionSummary {
  return "unread" in value && typeof value.unread === "number" && Number.isInteger(value.unread) && value.unread >= 0 && value.unread <= 1000000
    && "connected" in value && typeof value.connected === "boolean"
    && "signedIn" in value && typeof value.signedIn === "boolean"
    && (!("alerts" in value) || (Array.isArray(value.alerts) && value.alerts.every((alert) => typeof alert === "object" && alert !== null && validAlert(alert))));
}
