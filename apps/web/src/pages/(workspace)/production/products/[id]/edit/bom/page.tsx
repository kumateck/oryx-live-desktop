import { useParams } from "react-router";
import { BomSection } from "../../../../../../../modules/products/components/bom/bom-section";
import { useProductFormSource } from "../../../../../../../modules/products/hooks/use-product-form-source";

export default function EditProductBomPage() {
  const { id } = useParams();
  const { product } = useProductFormSource(id);
  if (!id) return null;
  return <BomSection productId={id} compositionSize={product?.baseQuantity ?? null} batchSize={product?.fullBatchSize ?? null} />;
}
