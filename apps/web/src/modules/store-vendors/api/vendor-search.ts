import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { readAllPages } from "@/shared/api/read-all-pages";
import { audit, vendorSchema, type Vendor } from "../schemas/vendor";
const pageSchema = z.object({
  data: z.array(vendorSchema),
  pageIndex: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
  totalRecordCount: z.number().int().nonnegative(),
});
export const vendorSearchApi = api.injectEndpoints({
  endpoints: (build) => ({
    searchStoreVendors: build.query<Vendor[], string>({
      async queryFn(search, context, _extra, baseQuery) {
        try {
          const rows = await readAllPages(
            async (page) => {
              if (page > 200) throw new Error("Vendor search supports at most 20,000 records. Narrow the server register before searching.");
              const response = await baseQuery({
                url: "/api/v1/vendors",
                params: { page, pageSize: 100 },
                headers: { Module: audit.module, SubModule: audit.subModule },
              });
              if (response.error) throw new Error("The complete vendor register could not be read. Retry search.");
              return pageSchema.parse(response.data);
            },
            (r) => r.id,
            context.signal,
          );
          const text = search.trim().toLocaleLowerCase();
          return { data: rows.filter((r) => [r.name, r.email, r.contactPerson ?? "", r.phone].some((s) => s.toLocaleLowerCase().includes(text))) };
        } catch (e) {
          return { error: { status: "CUSTOM_ERROR", error: e instanceof Error ? e.message : "Vendor search could not be completed." } };
        }
      },
      providesTags: [{ type: "vendor", id: "LIST" }],
    }),
  }),
});
