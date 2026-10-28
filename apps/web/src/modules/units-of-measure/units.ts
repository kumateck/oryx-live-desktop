import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { settingsApi } from "@/shared/api/generated/settings";
import { addTags } from "@/shared/api/add-tags";

export const unitPermissions = { view: "CanViewUnitOfMeasure", add: "CanCreateUnitOfMeasure", edit: "CanEditUnitOfMeasure", remove: "CanDeleteUnitOfMeasure" } as const;
export const unitAudit = { module: "Settings", subModule: "Unit of Measure" } as const;
// The numbers are the server's.
export const unitTypes = [{ value: "0", label: "Raw" }, { value: "1", label: "Packing" }, { value: "2", label: "Shipping" }] as const;
export const unitCategories = [{ value: "0", label: "Weight" }, { value: "1", label: "Volume" }, { value: "2", label: "Countable" }, { value: "3", label: "Length" }, { value: "4", label: "Area" }] as const;
const labelOf = (options: readonly { value: string; label: string }[], value: number) => options.find((item) => item.value === String(value))?.label ?? "Other";
export const unitTypeLabel = (value: number) => labelOf(unitTypes, value);
export const unitCategoryLabel = (value: number) => labelOf(unitCategories, value);

const list = { type: "Uoms" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
/** The server lists units through a POST. It is declared as a query here so the list is cached and refreshed like any other. */
const listApi = api.injectEndpoints({ endpoints: (build) => ({
  getUnitsPage: build.query<unknown, { page: number; pageSize: number; searchQuery: string; types?: number[] }>({ query: (body) => ({ url: "/api/v1/collection/uom/paginated", method: "POST", body: { types: [], ...body }, headers: { Module: unitAudit.module, SubModule: unitAudit.subModule } }), providesTags: [list] }),
}) });
export const { useGetUnitsPageQuery } = listApi;
export const unitApi = settingsApi.enhanceEndpoints({ endpoints: { postApiV1CollectionUom: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, putApiV1CollectionUomByUomId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, deleteApiV1CollectionUomByUomId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
export const unitPageSchema = z.object({ totalRecordCount: z.number().nullish(), data: z.array(z.object({ id: z.string().nullish(), name: text, symbol: text, description: text, isScalable: z.boolean().nullish(), type: z.number().nullish(), category: z.number().nullish() })).nullish() })
  .transform((page) => ({ totalRecordCount: page.totalRecordCount ?? 0, rows: (page.data ?? []).flatMap((row) => row.id ? [{ id: row.id, name: row.name ?? "", symbol: row.symbol ?? "", description: row.description, isScalable: row.isScalable ?? false, type: row.type ?? 0, category: row.category ?? 0 }] : []) }));
export type Unit = z.infer<typeof unitPageSchema>["rows"][number];

const option = z.object({ value: z.string().min(1), label: z.string() });
export const unitFormSchema = z.object({
  type: option.nullable().refine((value): boolean => Boolean(value), "Choose the type"),
  category: option.nullable().refine((value): boolean => Boolean(value), "Choose the category"),
  name: z.string().trim().min(1, "Enter the name").max(100, "Keep the name under 100 characters"),
  symbol: z.string().trim().min(1, "Enter the symbol").max(20, "Keep the symbol under 20 characters"),
  description: z.string().trim().max(500, "Keep the description under 500 characters").nullish(),
});
export type UnitFormValues = z.infer<typeof unitFormSchema>;
export const unitDefaults = (unit: Unit | null): UnitFormValues => unit
  ? { name: unit.name, symbol: unit.symbol, description: unit.description ?? "", type: { value: String(unit.type), label: unitTypeLabel(unit.type) }, category: { value: String(unit.category), label: unitCategoryLabel(unit.category) } }
  : { name: "", symbol: "", description: "", type: null, category: null };
