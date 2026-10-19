import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const question = z.object({ label: text, type: z.number().nullish(), options: z.array(z.object({ name: text })).nullish() });
export const ardFieldSchema = z.object({ id: z.string().nullish(), rank: z.number().nullish(), question: question.nullish() });
export const ardFormSchema = z.object({ sections: z.array(z.object({ id: z.string().nullish(), name: text, description: text, groupName: text, order: z.number().nullish(),
  fields: z.array(ardFieldSchema).nullish() })).nullish() });
export const ardAnswerSchema = z.object({ responseId: z.string().nullish(), value: text, complies: z.boolean().nullish(), formField: ardFieldSchema.nullish(),
  formulaGoverned: z.boolean().nullish(), formulaResultFinalized: z.boolean().nullish(), formulaExecutionId: z.string().nullish(), formulaDisplayResultsJson: z.string().nullish() });
export const ardAnswersSchema = z.array(ardAnswerSchema).nullish().transform((value) => value ?? []);
export type ArdResultField = z.infer<typeof ardFieldSchema>;
export interface ArdResultSection { id?: string | null | undefined; name: string | null; description: string | null; groupName?: string | null | undefined; fields: readonly ArdResultField[] }
