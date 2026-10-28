import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const person = z.object({ id: z.string().nullish(), name: text }).nullish().transform((value) => value?.name ?? "Unknown person");
const statuses = ["Upcoming", "Active", "Ended", "Ended early"] as const;
const delegation = z.object({ id: z.string(), delegator: person, delegate: person, startsAt: z.string(), endsAt: z.string(), reason: text, revokedAt: z.string().nullish(), status: z.number().nullish() })
  .transform((entry) => ({ id: entry.id, from: entry.delegator, to: entry.delegate, startsAt: entry.startsAt, endsAt: entry.endsAt, reason: entry.reason,
    status: statuses[entry.status ?? 2] ?? "Ended", open: entry.status === 0 || entry.status === 1 }));
export type Delegation = z.infer<typeof delegation>;
export const myDelegationsSchema = z.object({ given: z.array(delegation).nullish(), received: z.array(delegation).nullish() }).nullish()
  .transform((value) => ({ given: value?.given ?? [], received: value?.received ?? [] }));

/** The server's limit: a longer absence is a change of approver, done by transferring rights. */
export const maximumDays = 90;
const option = z.object({ value: z.string().min(1), label: z.string() });
const day = 86_400_000;
export const delegationFormSchema = z.object({
  delegate: option.nullable().refine((value): boolean => Boolean(value), "Choose who will decide your approvals"),
  start: z.date({ message: "Choose the first day" }).nullable().refine((value): boolean => Boolean(value), "Choose the first day"),
  end: z.date({ message: "Choose the last day" }).nullable().refine((value): boolean => Boolean(value), "Choose the last day"),
  reason: z.string().trim().max(500, "Keep the reason under 500 characters"),
}).superRefine((values, context) => {
  if (!values.start || !values.end) return;
  if (values.end < values.start) context.addIssue({ code: "custom", path: ["end"], message: "The last day cannot be before the first" });
  else if (values.end.getTime() - values.start.getTime() >= maximumDays * day) context.addIssue({ code: "custom", path: ["end"], message: `A delegation can last at most ${maximumDays} days` });
});
export type DelegationFormValues = z.infer<typeof delegationFormSchema>;

/**
 * Whole local days, from the start of the first to the end of the last (the next midnight). A first day
 * of today, or earlier, starts now; the server does the same.
 */
export function delegationRequest(values: DelegationFormValues, now: Date = new Date()) {
  const start = values.start ?? now;
  const midnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const end = values.end ?? now;
  return { delegateUserId: values.delegate?.value ?? "", startDate: (midnight < now ? now : midnight).toISOString(),
    endDate: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).toISOString(), reason: values.reason.trim() || null };
}
