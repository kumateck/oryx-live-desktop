import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1ProductByProductIdRoutesQuery } from "../../api/product-api";
import { useParsedQuery } from "../../hooks/use-parsed-query";
import { audit } from "../../lib/product-access";
import { batchQuantity, packageTotal } from "../../lib/product-detail";
import { routeListSchema, type BomItem, type ProductDetail, type ProductPackage, type ProductRoute } from "../../schemas/product-detail-schema";
import { MaterialSpecRef } from "../material-spec-ref";

const dash = "–";
const names = (values: readonly (string | null)[]) => values.filter(Boolean).join(", ") || dash;
/** A line to write on: the record is filled in by hand when a batch is issued. */
const blank = <span className="print-blank" />;

/**
 * The product as the head of a batch manufacturing record: product facts, the active bill of materials
 * scaled to a full batch, the packaging materials and the procedure. Batch facts (number, dates, who
 * issued it) are left as lines to fill in, since they belong to a batch and not to the product.
 */
export function ProductPrint({ product, onClose }: { product: ProductDetail; onClose: () => void }) {
  const routes = useParsedQuery(useGetApiV1ProductByProductIdRoutesQuery({ ...audit, productId: product.id }), routeListSchema);
  const batchSize = toLargestUnit(product.fullBatchSize, product.baseUoM?.symbol ?? null, "calculated")?.text ?? null;
  const items = [...(product.currentBillOfMaterial?.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const bomColumns: PrintColumn<BomItem>[] = [
    { id: "step", header: "Step", cell: (row) => row.order ?? dash, width: "6%" },
    { id: "code", header: "Code", cell: (row) => row.material?.code ?? dash, width: "12%" },
    { id: "material", header: "Material", cell: (row) => row.material?.name ?? dash },
    { id: "spec", header: "Spec ref", cell: (row) => row.material?.specificationNumber ?? dash, width: "13%" },
    { id: "unit", header: "Unit qty", align: "right", cell: (row) => toLargestUnit(row.baseQuantity, row.baseUoM)?.text ?? dash, width: "11%" },
    { id: "batch", header: "Batch qty", align: "right", width: "12%",
      cell: (row) => toLargestUnit(batchQuantity(row.baseQuantity, product.baseQuantity, product.fullBatchSize), row.baseUoM, "calculated")?.text ?? dash },
    { id: "function", header: "Function", cell: (row) => row.material?.category ?? dash, width: "12%" },
    { id: "grade", header: "Grade", cell: (row) => row.grade ?? dash, width: "9%" },
  ];
  const packageColumns: PrintColumn<ProductPackage>[] = [
    { id: "code", header: "Code", cell: (row) => row.material?.code ?? dash, width: "12%" },
    { id: "material", header: "Component material", cell: (row) => row.material?.name ?? dash },
    // Looked up for the packaging material itself; Oryx Next searched the raw materials' list for it and never found one.
    { id: "spec", header: "Spec ref", cell: (row) => row.material?.id ? <MaterialSpecRef materialId={row.material.id} known={null} /> : dash, width: "13%" },
    { id: "style", header: "Packing style", cell: (row) => row.productPacking ?? dash, width: "14%" },
    { id: "prescribed", header: "Prescribed", align: "right", cell: (row) => row.prescribedQuantity ?? dash, width: "10%" },
    { id: "extra", header: "Extra", align: "right", cell: (row) => row.packingExcessMargin ?? dash, width: "8%" },
    { id: "total", header: "Total", align: "right", cell: (row) => packageTotal(row.prescribedQuantity, row.packingExcessMargin) ?? dash, width: "8%" },
  ];
  const routeColumns: PrintColumn<ProductRoute>[] = [
    { id: "step", header: "Step", cell: (row) => row.order ?? dash, width: "6%" },
    { id: "operation", header: "Operation", cell: (row) => row.operation ?? dash },
    { id: "critical", header: "Critical", cell: (row) => row.isCritical ? "Yes" : "No", width: "8%" },
    { id: "centers", header: "Work centers", cell: (row) => names(row.workCenters), width: "18%" },
    { id: "time", header: "Estimated time", cell: (row) => row.estimatedTime ?? dash, width: "12%" },
    { id: "personnel", header: "Responsible", cell: (row) => names(row.personnel.map((person) => person.name)), width: "20%" },
  ];

  const procedureNote = routes.error ? `The procedure could not be loaded (${routes.error}); it is left out.` : null;
  return <PrintPreviewDialog title={product.name ?? "Product"} ready={!routes.loading} note={procedureNote} onClose={onClose}>
    <PrintHeader title="Batch manufacturing record" reference={product.code} />
    <PrintFacts facts={[
      { label: "Product", value: product.name }, { label: "Batch size", value: batchSize }, { label: "Batch no.", value: blank },
      { label: "Document number", value: product.documentNumber }, { label: "Revision", value: product.revisionNumber },
      { label: "Master formula number", value: product.masterFormulaNumber },
    ]} />
    <h2 className="print-section">Product information</h2>
    <PrintFacts facts={[
      { label: "Generic name", value: product.genericName }, { label: "Label claim", value: product.labelClaim },
      { label: "Filled volume", value: product.filledWeight }, { label: "Pack style", value: names(product.packings.map((packing) => packing.name)) },
      { label: "Action and use", value: product.actionUse }, { label: "Storage condition", value: product.storageCondition },
      { label: "FDA registration number", value: product.fdaRegistrationNumber }, { label: "Shelf life", value: product.shelfLife },
    ]} />
    <PrintFacts facts={[
      { label: "Manufacturing date", value: blank }, { label: "Expiry date", value: blank }, { label: "Date started", value: blank },
      { label: "Date completed", value: blank }, { label: "Issued on", value: blank }, { label: "Issued by", value: blank }, { label: "Issued to", value: blank },
    ]} />
    <PrintTable caption={`Bill of materials${product.currentBillOfMaterial?.version ? ` · version ${product.currentBillOfMaterial.version}` : ""}`}
      columns={bomColumns} rows={items} rowKey={(row, index) => row.id ?? String(index)} empty="This product has no active bill of materials" />
    <PrintTable caption="Packaging materials" columns={packageColumns} rows={product.packages}
      rowKey={(row, index) => row.id ?? String(index)} empty="No packaging materials" />
    {routes.error ? null : <PrintTable caption="Procedure" columns={routeColumns} rows={routes.rows ?? []}
      rowKey={(row) => row.id} empty={routes.loading ? "Loading the procedure…" : "No procedure steps"} />}
    <PrintSignatures roles={["Prepared by", "Checked by", "Approved by"]} />
  </PrintPreviewDialog>;
}
