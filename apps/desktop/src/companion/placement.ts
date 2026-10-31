import type { CompanionSize } from "./contract.js";
export interface Point { x: number; y: number }
export interface Area extends Point { width: number; height: number }
/** Character height in DIP for each size; medium is the original 112 DIP oryx in a 176 DIP window. */
export const characterHeight: Record<CompanionSize, number> = { small: 88, medium: 112, large: 136 };
/** The square companion window for a size, keeping the medium proportions. */
export const windowSize = (size: CompanionSize = "medium") => Math.round((characterHeight[size] * 176) / 112);
export const companionSize = windowSize("medium");
export const isCompanionSize = (value: unknown): value is CompanionSize => value === "small" || value === "medium" || value === "large";
/** The alerts list and a new-alert card, each with an 8 DIP transparent margin for the shadow. */
export const panelSizes = { list: { width: 376, height: 520 }, card: { width: 356, height: 116 } } as const;

const within = (value: number, start: number, span: number, size: number) => Math.round(Math.min(Math.max(value, start), start + Math.max(0, span - size)));
export function clampPlacement(point: Point, area: Area, height = companionSize, width = height): Point {
  return { x: within(point.x, area.x, area.width, width), y: within(point.y, area.y, area.height, height) };
}
/**
 * Places a panel beside the companion inside the work area: above it when the companion sits in
 * the lower half of the screen, otherwise below, aligned to its outer side.
 */
export function panelPosition(companion: Area, panel: { width: number; height: number }, area: Area, gap = 4): Point {
  const lower = companion.y + companion.height / 2 > area.y + area.height / 2;
  const right = companion.x + companion.width / 2 > area.x + area.width / 2;
  const x = right ? companion.x + companion.width - panel.width : companion.x;
  const y = lower ? companion.y - panel.height - gap : companion.y + companion.height + gap;
  return { x: within(x, area.x, area.width, panel.width), y: within(y, area.y, area.height, panel.height) };
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validAlert(value: object): boolean {
  return "label" in value && typeof value.label === "string" && value.label.trim().length > 0 && value.label.length <= 80
    && "message" in value && typeof value.message === "string" && value.message.trim().length > 0 && value.message.length <= 4000
    && "id" in value && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 100
    && "type" in value && (value.type === null || (typeof value.type === "number" && Number.isInteger(value.type)))
    && "priority" in value && typeof value.priority === "number" && Number.isInteger(value.priority) && value.priority >= 0 && value.priority <= 4
    && (!("shipmentDocumentId" in value) || (typeof value.shipmentDocumentId === "string" && uuid.test(value.shipmentDocumentId)))
    && (!("at" in value) || (typeof value.at === "string" && value.at.length <= 40 && Number.isFinite(Date.parse(value.at))));
}
export function validSummary(value: object): value is import("./contract.js").CompanionSummary {
  return "unread" in value && typeof value.unread === "number" && Number.isInteger(value.unread) && value.unread >= 0 && value.unread <= 1000000
    && "connected" in value && typeof value.connected === "boolean"
    && "signedIn" in value && typeof value.signedIn === "boolean"
    && (!("alerts" in value) || (Array.isArray(value.alerts) && value.alerts.every((alert) => typeof alert === "object" && alert !== null && validAlert(alert))));
}
