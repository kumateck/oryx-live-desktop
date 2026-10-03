import { z } from "zod";
import type { DomainEntitiesAlertsCreateAlertRequest } from "@/shared/api/generated/settings";
import { delaySchema, optionSchema, referenceSchema, settingsPageSchema, timeSpanSchema } from "@/modules/settings-support/forms";
import { readDelay, writeDelay } from "@/modules/settings-support/forms";
import { channelOptions, eventLabels, eventValues } from "../lib/events";

const notification = z.union(eventValues.map((value) => z.literal(value)));
export const alertRecordSchema = z.object({
  id: z.string().min(1), title: z.string().nullable(), notificationType: notification,
  alertTypes: z.array(z.union([z.literal(0), z.literal(1)])), timeFrame: timeSpanSchema,
  roles: z.array(referenceSchema), users: z.array(z.object({ id: z.string().min(1), firstName: z.string().nullish(), lastName: z.string().nullish() })),
  isDisabled: z.boolean(), isConfigurable: z.boolean(),
});
export type AlertRecord = z.infer<typeof alertRecordSchema>;
export const alertsPageSchema = settingsPageSchema(alertRecordSchema);
export const alertFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(255), event: optionSchema.nullable(),
  channels: z.array(optionSchema).min(1, "Choose a delivery channel"),
  roles: z.array(optionSchema), users: z.array(optionSchema), delay: delaySchema,
}).superRefine((value, context) => {
  if (!eventValues.some((event) => String(event) === value.event?.value)) context.addIssue({ code: "custom", path: ["event"], message: "Choose an alert event" });
  if (value.channels.some((channel) => channel.value !== "0" && channel.value !== "1")) context.addIssue({ code: "custom", path: ["channels"], message: "Choose supported delivery channels" });
  if (!value.roles.length && !value.users.length) context.addIssue({ code: "custom", path: ["roles"], message: "Choose at least one role or user" });
});
export type AlertValues = z.infer<typeof alertFormSchema>;
export function alertDefaults(record?: AlertRecord): AlertValues {
  return { title: record?.title ?? "", event: record ? { value: String(record.notificationType), label: eventLabels[record.notificationType] } : null,
    channels: record ? channelOptions.filter((item) => record.alertTypes.some((value) => String(value) === item.value)) : [],
    roles: record?.roles.map((item) => ({ value: item.id, label: item.name || "Unnamed role" })) ?? [],
    users: record?.users.map((item) => ({ value: item.id, label: [item.firstName, item.lastName].filter(Boolean).join(" ") || "Unnamed user" })) ?? [],
    delay: record ? readDelay(record.timeFrame) ?? { days: 0, hours: 0, minutes: 0, seconds: "0" } : { days: 0, hours: 0, minutes: 0, seconds: "0" },
  };
}
export function alertPayload(values: AlertValues): DomainEntitiesAlertsCreateAlertRequest {
  const notificationType = eventValues.find((value) => String(value) === values.event?.value);
  if (notificationType === undefined) throw new Error("Choose an alert event");
  return { title: values.title.trim(), notificationType, timeFrame: writeDelay(values.delay),
    alertTypes: values.channels.map((item) => { if (item.value === "0") return 0; if (item.value === "1") return 1; throw new Error("Invalid channel"); }),
    roleIds: [...new Set(values.roles.map((item) => item.value))], userIds: [...new Set(values.users.map((item) => item.value))],
  };
}
