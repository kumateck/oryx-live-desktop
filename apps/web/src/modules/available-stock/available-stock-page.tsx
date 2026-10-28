import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { identityApi } from "@/shared/api/generated/identity";
import { materialsApi } from "@/shared/api/generated/materials";
import { NoAccess } from "@/shared/auth/no-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { toLargestUnit } from "@/shared/units/quantity";
import { audit, availableStockSchema, departmentOptionsSchema, stockPermissions, type AvailableStockRow } from "./available-stock";
import { addTags } from "@/shared/api/add-tags";

const { useGetApiV1MaterialDepartmentApprovedMaterialsQuery } = materialsApi.enhanceEndpoints({ endpoints: { getApiV1MaterialDepartmentApprovedMaterials: (definition) => { definition.providesTags = addTags(definition.providesTags, [{ type: "StockOnShelves", id: "all" }]); } } });
const { useGetApiV1DepartmentQuery } = identityApi;
const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
interface Filter { department: SelectOption | null }
const column = dataTableColumns<AvailableStockRow>();
const columns = column.columns([
  column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
  column.accessor((row) => row.category ?? "", { id: "category", header: "Category", cell: ({ row }) => row.original.category ?? <span className="text-muted-foreground">–</span> }),
  column.accessor("free", { header: "Available", size: 160, cell: ({ row }) => <span className={row.original.free === 0 ? "font-medium text-destructive" : "font-medium"}>{show(row.original.free, row.original.unit)}</span> }),
  column.accessor("stock", { header: "In stock", size: 160, cell: ({ row }) => show(row.original.stock, row.original.unit) }),
  column.accessor("reserved", { header: "Reserved", size: 160, cell: ({ row }) => show(row.original.reserved, row.original.unit) }),
  column.accessor((row) => row.unitName ?? row.unit ?? "", { id: "unit", header: "Unit of measure", size: 160, cell: ({ row }) => row.original.unitName ?? row.original.unit ?? "–" }),
]);

/** Approved stock of raw or packaging materials, for every department or one of them. */
export function AvailableStockPage() {
  const { kind, select, tabs } = useKindTabs(stockPermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("materials in stock", busy);
  const form = useForm<Filter>({ defaultValues: { department: null } });
  const department = useWatch({ control: form.control, name: "department" });
  const departments = useGetApiV1DepartmentQuery({ ...audit, pageSize: 200 });
  const options = useMemo(() => departmentOptionsSchema.parse(departments.data?.data ?? []), [departments.data]);
  const fields = useMemo((): WizardField<Filter>[] => [{ type: InputTypes.SELECT, name: "department", label: "Department", mode: "single", source: "sync", options,
    placeholder: departments.isLoading ? "Loading…" : "All departments" }], [options, departments.isLoading]);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}|${department?.value ?? ""}` });
  const query = useGetApiV1MaterialDepartmentApprovedMaterialsQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(department ? { departmentId: department.value } : {}) }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? availableStockSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  if (kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">LOGISTICS</p><h1 className="text-xl font-semibold">Available stock</h1></div>
      <div className="flex flex-wrap items-end gap-3"><div className="w-64"><FormWizard form={form} fields={fields} /></div><KindSwitch tabs={tabs} kind={kind} onSelect={select} /></div>
    </div>
    <ServerDataTable label="Available stock" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned stock the app could not read." : null}
      emptyTitle={search.trim() ? "No materials match this search" : "No stock"} emptyDescription={search.trim() ? "Search by material name or code." : department ? `${department.label} holds no approved stock of this kind.` : "No department holds approved stock of this kind."} />
  </section>;
}
