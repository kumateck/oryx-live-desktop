import { useParams } from "react-router";
import { PackagingSection } from "../../../../../../../modules/products/components/packaging/packaging-section";

export default function EditProductPackagingPage() {
  const { id } = useParams();
  return id ? <PackagingSection productId={id} /> : null;
}
