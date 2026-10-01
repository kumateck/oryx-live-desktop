import { Badge } from "@/components/ui/badge";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { toLargestUnit } from "@/shared/units/quantity";
import { divisionLabel } from "../../lib/product-access";
import type { ProductDetail } from "../../schemas/product-detail-schema";

function price(product: ProductDetail): string | null {
  if (product.price === null) return null;
  const amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(product.price);
  return product.priceUoM ? `${amount} per ${product.priceUoM}` : amount;
}

export function ProductSummary({ product }: { product: ProductDetail }) {
  const unit = product.baseUoM?.symbol ?? null;
  const equipment = product.equipment;
  const bom = product.currentBillOfMaterial;
  return <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
    <DetailGroup title="Product information">
      <DetailItem label="Generic name" value={product.genericName} />
      <DetailItem label="Filled volume" value={product.filledWeight} />
      <DetailItem label="Department" value={product.department} />
      <DetailItem label="Division" value={divisionLabel(product.division)} />
      <DetailItem label="Document number" value={product.documentNumber} />
      <DetailItem label="Revision number" value={product.revisionNumber} />
    </DetailGroup>
    <DetailGroup title="Storage and regulatory">
      <DetailItem label="Storage condition" value={product.storageCondition} />
      <DetailItem label="Shelf life" value={product.shelfLife} />
      <DetailItem label="Action and use" value={product.actionUse} />
      <DetailItem label="FDA registration" value={product.fdaRegistrationNumber} />
      <DetailItem label="Master formula number" value={product.masterFormulaNumber} />
    </DetailGroup>
    <DetailGroup title="Quantities">
      <DetailItem label="Composition size" value={toLargestUnit(product.baseQuantity, unit)?.text} />
      <DetailItem label="Full batch size" value={toLargestUnit(product.fullBatchSize, unit)?.text} />
      <DetailItem label="Base unit" value={product.baseUoM ? [product.baseUoM.name, product.baseUoM.symbol ? `(${product.baseUoM.symbol})` : null].filter(Boolean).join(" ") : null} />
      <DetailItem label="Price" value={price(product)} />
    </DetailGroup>
    <DetailGroup title="Production">
      <DetailItem label="Equipment" value={equipment?.name} />
      <DetailItem label="Equipment number" value={equipment?.equipmentNumber} />
      <DetailItem label="Equipment capacity" value={toLargestUnit(equipment?.capacityQuantity, equipment?.uoM)?.text} />
      <DetailItem label="Location" value={equipment?.location} />
      <DetailItem label="Bill of materials" value={bom ? <Badge variant={bom.isActive ? "secondary" : "outline"}>{bom.isActive ? "Active" : "Inactive"}</Badge> : "None"} />
    </DetailGroup>
    <DetailGroup title="Packaging">
      <DetailItem label="Primary pack" value={product.primaryPackDescription} />
      <DetailItem label="Secondary pack" value={product.secondaryPackDescription} />
      <DetailItem label="Tertiary pack" value={product.tertiaryPackDescription} />
    </DetailGroup>
    {/* The product form saves label claims in the description field. */}
    {product.description || product.labelClaim ? <section className="min-w-0 rounded-lg border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold">Label claims</h2>
      <RichTextView html={product.description ?? product.labelClaim} className="text-sm" />
    </section> : null}
  </div>;
}
