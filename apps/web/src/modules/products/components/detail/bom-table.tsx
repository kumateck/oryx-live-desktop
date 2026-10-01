import { useMemo } from "react";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { batchQuantity } from "../../lib/product-detail";
import type { BomItem, ProductBom, ProductDetail } from "../../schemas/product-detail-schema";

const column = dataTableColumns<BomItem>();
const dash = "–";

/** One version of a bill of materials: its header line and its materials scaled to a full batch. */
export function BomTable({ bom, product }: { bom: ProductBom; product: ProductDetail }) {
  const columns = useMemo(() => column.columns([
    column.accessor((item) => item.order ?? "", { id: "step", header: "Step", size: 70 }),
    column.accessor((item) => item.material?.code ?? dash, { id: "code", header: "Code", size: 130 }),
    column.accessor((item) => item.material?.name ?? dash, { id: "material", header: "Material" }),
    column.accessor((item) => toLargestUnit(item.baseQuantity, item.baseUoM)?.text ?? dash, { id: "unit", header: "Unit quantity" }),
    column.accessor((item) => toLargestUnit(batchQuantity(item.baseQuantity, product.baseQuantity, product.fullBatchSize), item.baseUoM)?.text ?? dash,
      { id: "batch", header: "Batch quantity" }),
  ]), [product.baseQuantity, product.fullBatchSize]);
  const effective = formatDate(bom.effectiveDate);
  return <section className="min-w-0 space-y-2">
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Version {bom.version ?? dash}</span>
      {effective ? ` · Effective ${effective}` : ""} · {bom.isActive ? "Active" : "Inactive"}
    </p>
    <ListDataTable label={`Bill of materials version ${bom.version ?? ""}`} columns={columns} rows={bom.items}
      getRowId={(item) => item.id ?? `${item.order}-${item.material?.code}`} emptyTitle="This version has no materials" />
  </section>;
}

export function ActiveBomTab({ product }: { product: ProductDetail }) {
  return product.currentBillOfMaterial
    ? <BomTable bom={product.currentBillOfMaterial} product={product} />
    : <p className="py-6 text-center text-sm text-muted-foreground">This product has no bill of materials yet.</p>;
}

export function OutdatedBomsTab({ product }: { product: ProductDetail }) {
  if (product.outdatedBillOfMaterials.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No earlier versions of the bill of materials.</p>;
  }
  return <div className="space-y-6">{product.outdatedBillOfMaterials.map((bom, index) =>
    <BomTable key={`${bom.version}-${bom.effectiveDate}-${index}`} bom={bom} product={product} />)}</div>;
}
