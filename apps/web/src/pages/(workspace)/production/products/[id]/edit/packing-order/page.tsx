import { useParams } from "react-router";
import { PackingOrderSection } from "../../../../../../../modules/products/components/packing-order/packing-order-section";

export default function EditProductPackingOrderPage() {
  const { id } = useParams();
  return id ? <PackingOrderSection productId={id} /> : null;
}
