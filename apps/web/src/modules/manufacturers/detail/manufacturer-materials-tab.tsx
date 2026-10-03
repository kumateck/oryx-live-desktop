import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DomainEntitiesProcurementManufacturersManufacturerMaterialDto as ManufacturedMaterial } from "@/shared/api/generated/procurement";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { materialKindLabel, packQuantity } from "./manufacturer-overview";

interface Row { id: string; name: string; code: string; kind: string; pack: string | null; range: boolean }
const column = dataTableColumns<Row>();

/** The materials this manufacturer makes, and the pack sizes each comes in. */
export function ManufacturerMaterialsTab({ materials }: { materials: readonly ManufacturedMaterial[] }) {
  const [search, setSearch] = useState("");
  const rows = useMemo(() => materials.map((item, index): Row => ({
    id: `${item.material?.id ?? "material"}-${index}`, name: item.material?.name?.trim() || "Unnamed material", code: item.material?.code?.trim() ?? "",
    kind: materialKindLabel(item.material?.kind), pack: packQuantity(item), range: item.quantityType === 1,
  })), [materials]);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter((row) => `${row.name} ${row.code} ${row.kind}`.toLowerCase().includes(term)) : rows;
  }, [rows, search]);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.code || "No code"}</div></div> }),
    column.accessor("kind", { header: "Kind", size: 180, cell: ({ row }) => <Badge variant="outline">{row.original.kind}</Badge> }),
    column.accessor((row) => row.pack ?? "", { id: "pack", header: "Quantity per pack", cell: ({ row }) => row.original.pack
      ? <span className="break-words">{row.original.pack} <span className="text-xs text-muted-foreground">{row.original.range ? "(range)" : "(pack sizes)"}</span></span>
      : <span className="text-muted-foreground">Not recorded</span> }),
  ]), []);

  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">Materials this manufacturer makes. Suppliers are linked to a material and its manufacturer together.</p>
      <Input type="search" aria-label="Search manufactured materials" placeholder="Search materials" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-64" />
    </div>
    <ClientDataTable label="Manufactured materials" columns={columns} rows={shown} getRowId={(row) => row.id} fill={false}
      emptyTitle={search.trim() ? "No materials match this search" : "No materials recorded"}
      emptyDescription={search.trim() ? undefined : "Add the materials this manufacturer makes by editing it."} />
  </div>;
}
