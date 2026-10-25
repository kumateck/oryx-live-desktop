import { eventLabels, eventValues } from "@/shared/notifications/event-catalog";
export { eventLabels, eventValues } from "@/shared/notifications/event-catalog";
export const eventOptions = eventValues.map((value) => ({ value: String(value), label: eventLabels[value] }));
export const channelOptions = [{ value: "0", label: "Email" }, { value: "1", label: "In-app" }] as const;
