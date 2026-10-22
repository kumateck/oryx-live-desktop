import { api } from "@/shared/api/base-api";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { addTags } from "@/shared/api/add-tags";
import { readAllPages } from "@/shared/api/read-all-pages";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { Store } from "@/shared/inventory/stores";
import { receiptPage, type ReceiptPage, type ReceiptStatus, stockAudit } from "../schemas/stock";
const headers = { Module: stockAudit.module, SubModule: stockAudit.subModule };
const list = [
  { type: "procurement/inventory", id: "LIST" },
  { type: "item", id: "LIST" },
] as const;
export interface StockQuery {
  store: Store;
  status: ReceiptStatus;
  page: number;
  pageSize: number;
  search?: string;
}
// The published OpenAPI incorrectly declares a bare array; the server returns a pagination envelope.
export const stockApi = api.injectEndpoints({
  endpoints: (b) => ({
    stockRegister: b.query<ReceiptPage, StockQuery>({
      async queryFn(arg, context, _extra, baseQuery) {
        const load = async (page: number, pageSize = arg.pageSize) => {
          const result = await baseQuery({
            url: "/api/v1/procurement/inventory/purchased-items",
            params: { store: arg.store, status: arg.status, page, pageSize },
            headers,
          });
          if (result.error) throw new Error(apiErrorMessage(result.error));
          const parsed = receiptPage.parse(result.data);
          if (parsed.data.some((r) => r.item.store !== arg.store || r.status !== arg.status || r.item.id !== r.itemId))
            throw new Error("The stock response contains another store, status or item identity.");
          return parsed;
        };
        try {
          if (!arg.search?.trim()) return { data: await load(arg.page) };
          const all = await readAllPages(
            (page) => {
              if (page > 200) throw new Error("Stock search supports at most 20,000 receipts per store/status.");
              return load(page, 100);
            },
            (r) => r.id,
            context.signal,
          );
          const search = arg.search.trim().toLocaleLowerCase();
          const filtered = all.filter((r) => [r.item.name, r.item.code, r.memo?.code].some((s) => s?.toLocaleLowerCase().includes(search)));
          return {
            data: {
              data: filtered.slice((arg.page - 1) * arg.pageSize, arg.page * arg.pageSize),
              pageIndex: arg.page,
              pageCount: Math.ceil(filtered.length / arg.pageSize),
              totalRecordCount: filtered.length,
            },
          };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error instanceof Error ? error.message : "The current stock register could not be verified." } };
        }
      },
      providesTags: list,
    }),
  }),
});
export const receiptApi = inventoryApi.enhanceEndpoints({
  endpoints: {
    postApiV1ProcurementInventoryItemsByIdApprove: (d) => {
      d.invalidatesTags = addTags(d.invalidatesTags, list);
    },
    postApiV1ProcurementInventoryItemsByIdReject: (d) => {
      d.invalidatesTags = addTags(d.invalidatesTags, list);
    },
  },
});
