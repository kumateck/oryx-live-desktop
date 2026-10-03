import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { divisionOptions, warehouseTypeOptions, type WarehouseScope } from "./lib/warehouse-kpis";

const ALL = "all";
const warehousesSchema = z.object({ data: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish(), type: z.number().nullish(), division: z.number().nullish() })).nullish() });

function ScopeSelect({ label, value, onChange, all, options, disabled = false }: { label: string; value: string | undefined; onChange: (value: string | undefined) => void; all: string; options: readonly { value: string; label: string }[]; disabled?: boolean }) {
  return <Select value={value ?? ALL} disabled={disabled} onValueChange={(next) => onChange(next === ALL ? undefined : next)}>
    <SelectTrigger aria-label={label} size="sm" className="w-full sm:w-48"><SelectValue placeholder={all} /></SelectTrigger>
    <SelectContent position="popper"><SelectItem value={ALL}>{all}</SelectItem>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>;
}

/**
 * Narrows the warehouse dashboard to a division, a warehouse type and one warehouse. A warehouse can only be
 * chosen once a division is; changing division or type clears the warehouse, which may no longer be in the list.
 */
export function WarehouseScopeFilters({ scope, onChange }: { scope: WarehouseScope; onChange: (scope: WarehouseScope) => void }) {
  const query = warehouseApi.useGetApiV1WarehouseQuery({ page: 1, pageSize: 200, module: "Warehouse", subModule: "Dashboard" });
  const parsed = warehousesSchema.safeParse(query.data ?? {});
  const warehouses = (parsed.success ? parsed.data.data ?? [] : []).filter((item) => item.id && (scope.warehouseType === undefined || item.type === scope.warehouseType) && (scope.division === undefined || item.division === scope.division));
  const narrowed = scope.division !== undefined || scope.warehouseType !== undefined || scope.warehouseId !== undefined;
  const without = (key: keyof WarehouseScope): WarehouseScope => { const next = { ...scope }; delete next[key]; delete next.warehouseId; return next; };
  return <div role="group" aria-label="Scope" className="flex flex-wrap items-center gap-2">
    <ScopeSelect label="Division" all="All divisions" value={scope.division?.toString()} options={divisionOptions.map((item) => ({ value: String(item.value), label: item.label }))}
      onChange={(value) => onChange(value === undefined ? without("division") : { ...without("division"), division: Number(value) as 0 | 1 })} />
    <ScopeSelect label="Warehouse type" all="All types" value={scope.warehouseType?.toString()} options={warehouseTypeOptions.map((item) => ({ value: String(item.value), label: item.label }))}
      onChange={(value) => onChange(value === undefined ? without("warehouseType") : { ...without("warehouseType"), warehouseType: Number(value) as 0 | 1 | 3 })} />
    <ScopeSelect label="Warehouse" all={query.isFetching ? "Loading warehouses…" : scope.division === undefined ? "Choose a division first" : "All warehouses"} value={scope.warehouseId} disabled={scope.division === undefined || query.isFetching}
      options={warehouses.map((item) => ({ value: item.id!, label: item.name?.trim() || "Unnamed warehouse" }))} onChange={(value) => onChange(value === undefined ? without("warehouseId") : { ...scope, warehouseId: value })} />
    {narrowed ? <Button type="button" size="sm" variant="ghost" onClick={() => onChange({})}>Clear</Button> : null}
  </div>;
}
