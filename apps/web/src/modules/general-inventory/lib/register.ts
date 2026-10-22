import { readAllPages } from "@/shared/api/read-all-pages";
import { itemPage, type InventoryItem } from "@/shared/inventory/contracts";
export async function itemRegister<T>(
  load: (page: number) => Promise<{ data?: T[] | null; pageIndex?: number; pageCount?: number; totalRecordCount?: number }>,
  store: InventoryItem["store"],
) {
  return readAllPages(
    async (page) => {
      if (page > 200) throw new Error("Inventory validation supports at most 20,000 items per store.");
      const result = itemPage.parse(await load(page));
      if (result.data.some((r) => r.store !== store)) throw new Error("The inventory response contains another store.");
      return result;
    },
    (r) => r.id,
    new AbortController().signal,
  );
}
export function duplicateItem(rows: InventoryItem[], name: string, code: string, id?: string) {
  const normalize = (v: string) => v.trim().toLocaleUpperCase();
  return rows.some((r) => r.id !== id && (normalize(r.name) === normalize(name) || normalize(r.code) === normalize(code)));
}
