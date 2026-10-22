import { z } from "zod";
import { readAllPages } from "@/shared/api/read-all-pages";
import { serviceSchema, type StoreService } from "./contracts";
const pageSchema = z.object({
  data: z.array(serviceSchema),
  pageIndex: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
  totalRecordCount: z.number().int().nonnegative(),
});
export async function readServiceRegister<T>(
  load: (active: boolean, page: number) => Promise<{ data?: T[] | null; pageIndex?: number; pageCount?: number; totalRecordCount?: number }>,
  signal: AbortSignal,
): Promise<StoreService[]> {
  const lists = await Promise.all(
    [true, false].map((active) =>
      readAllPages(
        async (page) => {
          if (page > 200) throw new Error("Service validation supports at most 20,000 records per status.");
          const result = pageSchema.parse(await load(active, page));
          if (result.data.some((r) => r.isActive !== active)) throw new Error("The server returned services outside the requested status.");
          return result;
        },
        (r) => r.id,
        signal,
      ),
    ),
  );
  const rows = lists.flat();
  if (new Set(rows.map((r) => r.id)).size !== rows.length) throw new Error("Service status changed while reading the register. Retry verification.");
  return rows;
}
export function serviceNamingProblem(rows: StoreService[], name: string, code: string, id?: string): string | null {
  const normalized = (s: string) => s.trim().toLocaleLowerCase();
  if (rows.some((r) => r.id !== id && (normalized(r.name) === normalized(name) || normalized(r.code ?? "") === normalized(code))))
    return "Another service already uses this name or code. Review the complete active and inactive register.";
  return null;
}
