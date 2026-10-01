import { Skeleton } from "@/shared/skeleton/skeleton";
import { useGetApiV1MaterialSpecificationsMaterialByMaterialIdQuery } from "../api/product-api";

/**
 * A material's specification number. Each cell looks its own up, so the table appears at once and
 * the numbers fill in; a material used on several lines is requested once.
 */
export function MaterialSpecRef({ materialId, known }: { materialId: string; known: string | null }) {
  const query = useGetApiV1MaterialSpecificationsMaterialByMaterialIdQuery({ module: "Production", subModule: "Packing", materialId }, { skip: known !== null });
  if (known !== null) return known || "–";
  if (query.isLoading) return <Skeleton className="h-4 w-24" />;
  return query.data?.specificationNumber?.trim() || "–";
}
