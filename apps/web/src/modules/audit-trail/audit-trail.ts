import { z } from "zod";

export const audit = { module: "Access Management", subModule: "Audit Trail" } as const;
/** What kind of thing was done. The numbers are the server's. */
export const actionTypeLabels: Record<number, string> = { 0: "Created", 1: "Viewed", 2: "Changed", 3: "Deleted" };

const text = z.string().nullish().transform((value) => value?.trim() || null);
/** One thing a user did, as the server recorded it. */
export const activityRowsSchema = z.array(z.object({ user: z.object({ id: z.string().nullish(), firstName: text, lastName: text, email: text }).nullish(), action: text, module: text, subModule: text,
  actionType: z.number().nullish(), ipAddress: text, url: text, httpMethod: text, statusCode: z.number().nullish(), createdAt: z.string().nullish() })).nullish()
  .transform((value) => (value ?? []).map((entry, index) => ({ id: `${entry.createdAt ?? "entry"}-${index}`, user: [entry.user?.firstName, entry.user?.lastName].filter(Boolean).join(" ") || entry.user?.email || "Unknown user",
    email: entry.user?.email ?? null, action: entry.action ?? "Action not described", area: [entry.module, entry.subModule].filter(Boolean).join(" · ") || null, actionType: entry.actionType ?? null,
    ipAddress: entry.ipAddress, when: entry.createdAt ?? null,
    // A request the server refused is still part of the trail.
    failed: typeof entry.statusCode === "number" && entry.statusCode >= 400, statusCode: entry.statusCode ?? null })));
export type ActivityRow = z.infer<typeof activityRowsSchema>[number];
