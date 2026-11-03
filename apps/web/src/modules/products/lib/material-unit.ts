import { z } from "zod";

export const materialUnitSchema = z.object({ id: z.string().trim().min(1), symbol: z.string().trim().min(1) });
export type MaterialUnit = z.infer<typeof materialUnitSchema>;
export interface MaterialUnitAudit { module: string; subModule: string }
