import { z } from "zod";
import { Classification } from "./contracts";
import { itemLineProblems } from "./item-line-model";

const itemLine = z.object({
  key: z.string(), quantity: z.string(),
  item: z.object({
    id: z.string(), name: z.string(), code: z.string(), classification: z.enum(Classification), available: z.number(),
    unitId: z.string(), unitName: z.string(), unitSymbol: z.string().nullable(),
  }).nullable(),
});
export interface ItemLineRules { fractions?: boolean; capToStock?: boolean; requireUnit?: boolean }
export function inventoryLineProblems(lines: readonly z.infer<typeof itemLine>[], rules: ItemLineRules) {
  const problems = itemLineProblems(lines, rules);
  if (rules.requireUnit) for (const line of lines) if (line.item && !line.item.unitId) problems.set(line.key, "This item has no unit of measure, so it cannot be ordered.");
  return problems;
}
export const itemLinesSchema = (rules: ItemLineRules) => z.array(itemLine).superRefine((lines, context) => {
  for (const [key, message] of inventoryLineProblems(lines, rules)) {
    const index = lines.findIndex((line) => line.key === key);
    context.addIssue({ code: "custom", path: index < 0 ? [] : [index, "quantity"], message });
  }
});
