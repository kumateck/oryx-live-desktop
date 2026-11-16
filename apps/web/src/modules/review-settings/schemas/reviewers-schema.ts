import { z } from "zod";
import { optionSchema } from "@/modules/settings-support/forms";
import type { ReviewConfiguration, SaveReviewConfiguration } from "@/shared/reviews/review-schema";

export const reviewersFormSchema = z.object({ roles: z.array(optionSchema), users: z.array(optionSchema) })
  .refine((value) => value.roles.length + value.users.length > 0, { path: ["roles"], message: "Name at least one role or person" });
export type ReviewersValues = z.infer<typeof reviewersFormSchema>;

export function reviewersDefaults(configuration: ReviewConfiguration | undefined): ReviewersValues {
  const assignees = configuration?.assignees ?? [];
  return {
    roles: assignees.flatMap((item) => item.role ? [{ value: item.role.id, label: item.role.name ?? "Unnamed role" }] : []),
    users: assignees.flatMap((item) => item.user ? [{ value: item.user.id, label: item.user.name ?? "Unnamed user" }] : []),
  };
}

export function reviewersPayload(itemType: string, values: ReviewersValues): SaveReviewConfiguration {
  const valid = reviewersFormSchema.parse(values);
  return { itemType, assignees: [...valid.roles.map((role) => ({ roleId: role.value })), ...valid.users.map((user) => ({ userId: user.value }))] };
}
