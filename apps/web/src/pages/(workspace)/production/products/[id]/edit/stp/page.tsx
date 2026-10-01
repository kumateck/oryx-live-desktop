import { useParams } from "react-router";
import { StpSection } from "../../../../../../../modules/products/components/stp/stp-section";

export default function EditProductStpPage() {
  const { id } = useParams();
  return id ? <StpSection productId={id} /> : null;
}
