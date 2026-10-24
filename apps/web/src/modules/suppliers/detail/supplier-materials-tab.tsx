import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DomainEntitiesProcurementSuppliersSupplierManufacturerDto as Supply } from "@/shared/api/generated/procurement";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { manufacturerPath, manufacturerPermissions } from "@/modules/manufacturers/lib/manufacturer-access";

interface Row { id: string; material: string; code: string; manufacturer: string; manufacturerId: string | null; unit: string; preferred: boolean }
const column = dataTableColumns<Row>();
const dash = "–";

/** What can be bought from this supplier: each material, who makes it, and the unit it is bought in. */
export function SupplierMaterialsTab({ supplies, loading, error, onRetry }: { supplies: readonly Supply[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const [search, setSearch] = useState("");
  const mayOpenManufacturer = useAccess().has(manufacturerPermissions.view);
  const rows = useMemo(() => supplies.map((item, index): Row => ({
    id: `${item.material?.id ?? "material"}-${item.manufacturer?.id ?? "manufacturer"}-${index}`,
    material: item.material?.name?.trim() || "Unnamed material", code: item.material?.code?.trim() ?? "",
    manufacturer: item.manufacturer?.name?.trim() ?? "", manufacturerId: item.manufacturer?.id ?? null,
    unit: item.purchaseUnit?.trim() || item.uoM?.symbol?.trim() || item.uoM?.name?.trim() || "", preferred: Boolean(item.default),
  })), [supplies]);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter((row) => `${row.material} ${row.code} ${row.manufacturer}`.toLowerCase().includes(term)) : rows;
  }, [rows, search]);
  const columns = useMemo(() => column.columns([
    column.accessor("material", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.material}</div>
      <div className="text-xs text-muted-foreground">{row.original.code || "No code"}</div></div> }),
    column.accessor("manufacturer", { header: "Manufacturer", cell: ({ row }) => !row.original.manufacturer ? dash
      : mayOpenManufacturer && row.original.manufacturerId ? <Link className="break-words text-primary underline-offset-2 hover:underline" to={manufacturerPath(row.original.manufacturerId)}>{row.original.manufacturer}</Link>
        : <span className="break-words">{row.original.manufacturer}</span> }),
    column.accessor((row) => row.unit || dash, { id: "unit", header: "Purchase unit", size: 150 }),
    column.accessor((row) => row.preferred ? "Preferred" : "Alternative", { id: "role", header: "Source", size: 130,
      cell: ({ row }) => row.original.preferred ? <Badge>Preferred</Badge> : <Badge variant="outline">Alternative</Badge> }),
  ]), [mayOpenManufacturer]);

  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Materials this supplier is set up to supply. The preferred source of a material is the one offered first when ordering.</p>
      <Input type="search" aria-label="Search materials or manufacturers" placeholder="Search materials or manufacturers" value={search}
        onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-64" />
    </div>
    <ClientDataTable label="Materials supplied" columns={columns} rows={shown} getRowId={(row) => row.id} loading={loading} error={error} onRetry={onRetry} fill={false}
      emptyTitle={search.trim() ? "No materials match this search" : "No materials linked"}
      emptyDescription={search.trim() ? undefined : "Link materials and their manufacturers by editing the supplier."} />
  </div>;
}
