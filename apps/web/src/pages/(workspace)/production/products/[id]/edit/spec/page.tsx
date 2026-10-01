import { useParams } from "react-router";
import { SpecificationSection } from "../../../../../../../modules/products/components/spec/spec-section";
import { useProductFormSource } from "../../../../../../../modules/products/hooks/use-product-form-source";

export default function EditProductSpecificationPage() {
  const { id } = useParams();
  const { product } = useProductFormSource(id);
  // The division only decides the suggested number for a new specification, so the list does not wait for the product.
  return id ? <SpecificationSection productId={id} division={product?.division ?? null} /> : null;
}
