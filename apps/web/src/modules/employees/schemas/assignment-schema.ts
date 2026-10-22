import { z } from "zod";
const option = z.object({ value: z.string().min(1), label: z.string() });
export const assignmentSchema = z.object({ department: option.nullable().refine((v): boolean => v !== null, "Choose a department"), designation: option.nullable().refine((v): boolean => v !== null, "Choose a designation"), manager: option.nullable(), warehouses: z.array(option), staffNumber: z.string().trim().min(1).max(15), level: z.object({ value: z.enum(["0", "1", "2"]), label: z.string() }).nullable(), startDate: z.date().nullable() });
export type AssignmentValues = z.infer<typeof assignmentSchema>;
