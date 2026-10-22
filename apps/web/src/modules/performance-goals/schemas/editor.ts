import { z } from "zod";
import { GoalStatus } from "@/shared/performance/contracts";
export const option = z.object({ value: z.uuid(), label: z.string() });
export const goalEditorSchema = z
  .object({
    employee: option.nullable(),
    cycle: option.nullable(),
    title: z.string().trim().min(1).max(300),
    description: z.string().max(2000),
    weight: z.number().int().min(1).max(100),
    targetDate: z.date().nullable(),
    status: z.object({ value: z.enum(["0", "1", "2", "3"]), label: z.string() }).nullable(),
    progressPercentage: z.number().int().min(0).max(100),
    managerComments: z.string().max(2000),
  })
  .superRefine((v, ctx) => {
    for (const name of ["employee", "cycle", "targetDate", "status"] as const)
      if (!v[name]) ctx.addIssue({ code: "custom", path: [name], message: "This field is required." });
    const status = goalStatus(v.status?.value);
    if (status === GoalStatus.NotStarted && v.progressPercentage !== 0)
      ctx.addIssue({ code: "custom", path: ["progressPercentage"], message: "A goal that has not started must have 0% progress." });
    if (status === GoalStatus.Completed && v.progressPercentage !== 100)
      ctx.addIssue({ code: "custom", path: ["progressPercentage"], message: "A completed goal must have 100% progress." });
  });
export type GoalValues = z.infer<typeof goalEditorSchema>;
export const goalStatus = (value: string | undefined): GoalStatus =>
  value === "1" ? GoalStatus.InProgress : value === "2" ? GoalStatus.Completed : value === "3" ? GoalStatus.Missed : GoalStatus.NotStarted;
