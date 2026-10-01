import { useParams } from "react-router";
import { ArdSection } from "../../../../../../../modules/products/components/ard/ard-section";

export default function EditProductArdPage() {
  const { id } = useParams();
  return id ? <ArdSection productId={id} /> : null;
}
