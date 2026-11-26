import { z } from "zod";

export const boardOrderPermissions = { view: "CanViewDepartmentProductionBoardOrder", edit: "CanReorderDepartmentProductionBoard" } as const;
export const boardOrderPath = "/settings/production-board-order";
export const boardOrderSchema = z.object({ departmentId: z.string(), departmentName: z.string(), version: z.string().length(64),
  operations: z.array(z.object({ id: z.string(), name: z.string(), order: z.number().int() })) });
export type BoardOperation = z.infer<typeof boardOrderSchema>["operations"][number];
export const departmentsSchema = z.object({ data: z.array(z.object({ id: z.string(), name: z.string(), type: z.number().nullish() })) });

export const tabletSequence = [
  "Requisition of BMR to Quality Assurance (QA). Issue of BMR by QA.",
  "Indent of Raw Material (R.M.) and Packing Material (P.M.) Requisitions by Production as per BMR.",
  "Line clearance for dispensing",
  "Dispensing of Raw Material and issue of Packing Materials in the presence of Production, QA, and a Store person.",
  "Equipment & Area Clearance by QA.",
  "Product Preparation",
  "Intermediate granules sampling and release by QA. Testing by QC.",
  "Line Clearance by QA for Filling and Capping / Compression Activity",
  "Filling and Capping / Compression Activity",
  "Bulk Sampling and Released by QA, Testing by QC",
  "Line clearance for Coating activity",
  "Coating Activity",
  "Line clearance for primary packing",
  "Primary packing.",
  "Leak test checking.",
  "Line clearance for secondary packing",
  "Secondary packing activity.",
  "Finished product Sampling, Collection of Retain Samples, Testing by QA.",
  "Inspection & release by QA.",
  "Finished Product Transfer slip issued by approved personnel to the Finished Goods Quarantine Store (FGQS).",
  "Dispatch.",
] as const;

const normalized = (name: string) => name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const tabletRanks = new Map(tabletSequence.map((name, index) => [normalized(name), index]));
/** Unmatched operations stay visible at the end, in their current relative order. */
export function tabletOrder(rows: readonly BoardOperation[]): BoardOperation[] {
  return rows.map((row, index) => ({ row, index, rank: tabletRanks.get(normalized(row.name)) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index).map(({ row }) => row);
}
