import { z } from "zod";
import { settingsApi } from "@/shared/api/generated/settings";

export const holidayPermissions = { view: "CanViewHolidays", add: "CanCreateHoliday", edit: "CanEditHoliday", remove: "CanDeleteHoliday" } as const;
export const holidayAudit = { module: "Settings", subModule: "Holidays" } as const;
const list = { type: "Holidays" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
export const holidayApi = settingsApi.enhanceEndpoints({ endpoints: { getApiV1Holidays: { providesTags: [list] }, postApiV1Holidays: { invalidatesTags: changed }, putApiV1HolidaysById: { invalidatesTags: changed }, deleteApiV1HolidaysById: { invalidatesTags: changed } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
const row = z.object({ id: z.string().nullish(), name: text, date: text, description: text });
/** The server has sent this list both bare and wrapped in a page; either is read. Soonest first. */
export const holidayRowsSchema = z.union([z.array(row), z.object({ data: z.array(row).nullish() }).transform((page) => page.data ?? [])]).nullish()
  .transform((rows) => (rows ?? []).flatMap((item) => item.id && item.date ? [{ id: item.id, name: item.name ?? "Unnamed holiday", date: item.date, description: item.description }] : []).sort((a, b) => a.date.localeCompare(b.date)));
export type Holiday = z.infer<typeof holidayRowsSchema>[number];

export const holidayFormSchema = z.object({
  name: z.string().trim().min(1, "Enter the holiday name").max(150, "Keep the name under 150 characters"),
  date: z.date().nullable().refine((value): boolean => value instanceof Date && !Number.isNaN(value.getTime()), "Choose the date"),
  description: z.string().trim().max(500, "Keep the description under 500 characters").nullish(),
});
export type HolidayFormValues = z.infer<typeof holidayFormSchema>;

/** A holiday is a calendar day, not a moment: it is sent as that day at midnight UTC so no time zone moves it to the day before. */
export const dayToServer = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
/** The calendar day the server holds, as a local date for the picker. */
export function dayFromServer(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}
export const holidayDay = (value: string) => dayFromServer(value)?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "short" }) ?? "–";
