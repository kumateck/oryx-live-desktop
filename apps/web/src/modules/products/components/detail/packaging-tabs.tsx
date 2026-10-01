import { Badge } from "@/components/ui/badge";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { packageTotal } from "../../lib/product-detail";
import type { ProductDetail, ProductPackage, ProductPacking } from "../../schemas/product-detail-schema";

const dash = "–";
const packageColumn = dataTableColumns<ProductPackage>();
const packageColumns = packageColumn.columns([
  packageColumn.display({ id: "number", header: "#", size: 50, cell: ({ row }) => row.index + 1 }),
  packageColumn.accessor((item) => item.material?.code ?? dash, { id: "code", header: "Code", size: 120 }),
  packageColumn.accessor((item) => item.material?.name ?? dash, { id: "material", header: "Component material" }),
  packageColumn.accessor((item) => item.directLinkMaterial?.name ?? dash, { id: "linked", header: "Linked material" }),
  packageColumn.accessor((item) => item.productPacking ?? dash, { id: "style", header: "Packing style" }),
  packageColumn.accessor((item) => item.prescribedQuantity ?? dash, { id: "prescribed", header: "Prescribed qty", size: 120 }),
  packageColumn.accessor((item) => item.packingExcessMargin ?? dash, { id: "excess", header: "Extra", size: 80 }),
  packageColumn.accessor((item) => packageTotal(item.prescribedQuantity, item.packingExcessMargin) ?? dash, { id: "total", header: "Total qty", size: 100 }),
]);

export function PackagingTab({ product }: { product: ProductDetail }) {
  return <ListDataTable label="Packaging materials" columns={packageColumns} rows={product.packages}
    getRowId={(item) => item.id ?? `${item.material?.code}-${item.productPacking}`} emptyTitle="No packaging materials" />;
}

const packingColumn = dataTableColumns<ProductPacking>();
const packingColumns = packingColumn.columns([
  packingColumn.accessor((item) => item.name ?? dash, { id: "name", header: "Packing style", cell: ({ row }) =>
    <span className="flex flex-wrap items-center gap-2">{row.original.name ?? dash}{row.original.isDefault ? <Badge variant="secondary">Default</Badge> : null}</span> }),
  packingColumn.accessor((item) => item.basePackingUoM ? `${item.basePackingUoM.name ?? ""}${item.basePackingUoM.symbol ? ` (${item.basePackingUoM.symbol})` : ""}`.trim() || dash : dash,
    { id: "uom", header: "Base packing unit" }),
  packingColumn.accessor((item) => item.basePackingQuantity ?? dash, { id: "base", header: "Base packing qty", size: 120 }),
  packingColumn.accessor((item) => item.expectedYield ?? dash, { id: "yield", header: "Expected yield", size: 120 }),
  packingColumn.accessor((item) => item.packPerShipper ?? dash, { id: "shipper", header: "Packs per shipper", size: 120 }),
  // Shown in full: Oryx Next hid these behind a hover card, which keyboard and touch users could not open.
  packingColumn.display({ id: "units", header: "Units", cell: ({ row }) => row.original.packingLists.length
    ? <ul className="space-y-0.5">{[...row.original.packingLists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((unit, index) =>
      <li key={index}>{unit.quantity ?? dash} {unit.uom ?? ""}</li>)}</ul> : dash }),
  packingColumn.accessor((item) => item.description ?? dash, { id: "description", header: "Description" }),
]);

export function PackingStylesTab({ product }: { product: ProductDetail }) {
  return <ListDataTable label="Packing styles" columns={packingColumns} rows={product.packings}
    getRowId={(item) => item.id ?? item.name ?? ""} emptyTitle="No packing styles" />;
}
