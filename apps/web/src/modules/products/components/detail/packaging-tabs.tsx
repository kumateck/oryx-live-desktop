import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCount } from "@/shared/packing/packs";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { packageTotal } from "../../lib/product-detail";
import { unitLabel } from "../../lib/product-form";
import { PackingUnitsCell, PacksPerShipperCell } from "../packing-style/packing-units-cell";
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
const unitText = (unit: { name: string | null; symbol: string | null } | null) => unit ? unitLabel(unit) : "";
const unitRows = (item: ProductPacking) => [...item.packingLists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((unit) => ({ uom: { label: unitText(unit.uom) }, quantity: unit.quantity ?? Number.NaN }));
const packingColumnsFor = (baseUnit: string | null) => packingColumn.columns([
  packingColumn.accessor((item) => item.name ?? dash, { id: "name", header: "Packing style", cell: ({ row }) =>
    <span className="flex flex-wrap items-center gap-2">{row.original.name ?? dash}{row.original.isDefault ? <Badge variant="secondary">Default</Badge> : null}</span> }),
  packingColumn.accessor((item) => unitText(item.basePackingUoM) || dash, { id: "uom", header: "Base packing unit" }),
  packingColumn.accessor((item) => item.basePackingQuantity ?? null, { id: "base", header: "Base packing qty", size: 120, cell: ({ row }) =>
    row.original.basePackingQuantity === null ? dash : `${formatCount(row.original.basePackingQuantity)}${baseUnit ? ` ${baseUnit}` : ""}` }),
  packingColumn.accessor((item) => item.expectedYield ?? null, { id: "yield", header: "Expected yield", size: 140, cell: ({ row }) =>
    row.original.expectedYield === null ? dash : formatCount(row.original.expectedYield) }),
  packingColumn.accessor((item) => item.packPerShipper ?? null, { id: "shipper", header: "Packs per shipper", size: 170, cell: ({ row }) =>
    <PacksPerShipperCell units={unitRows(row.original)} baseLabel={unitText(row.original.basePackingUoM)} packPerShipper={row.original.packPerShipper} /> }),
  // Shown in full: Oryx Next hid these behind a hover card, which keyboard and touch users could not open.
  packingColumn.display({ id: "units", header: "Units", size: 260, cell: ({ row }) =>
    <PackingUnitsCell units={unitRows(row.original)} baseLabel={unitText(row.original.basePackingUoM)} packPerShipper={row.original.packPerShipper} /> }),
  packingColumn.accessor((item) => item.description ?? dash, { id: "description", header: "Description" }),
]);

export function PackingStylesTab({ product }: { product: ProductDetail }) {
  const columns = useMemo(() => packingColumnsFor(product.baseUoM?.symbol ?? null), [product.baseUoM?.symbol]);
  return <ListDataTable label="Packing styles" columns={columns} rows={product.packings}
    getRowId={(item) => item.id ?? item.name ?? ""} emptyTitle="No packing styles" />;
}
