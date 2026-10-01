import { useParams } from "react-router";
import { PackingStyleSection } from "../../../../../../../modules/products/components/packing-style/packing-style-section";
import { useProductFormSource } from "../../../../../../../modules/products/hooks/use-product-form-source";

export default function EditProductPackingStylePage() {
  const { id } = useParams();
  const { product } = useProductFormSource(id);
  if (!id) return null;
  return <PackingStyleSection productId={id} fullBatchSize={product?.fullBatchSize ?? null} baseUnit={product?.baseUoM?.symbol ?? null} />;
}
