import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdQuery } from "../api/product-api";
import { audit } from "../lib/product-access";
import { productDetailSchema } from "../schemas/product-detail-schema";

export function useProductDetail(productId: string | undefined) {
  const query = useGetApiV1ProductByProductIdQuery({ ...audit, productId: productId ?? "" }, { skip: !productId });
  const parsed = useMemo(() => query.data ? productDetailSchema.safeParse(query.data) : null, [query.data]);
  const notFound = Boolean(query.error && "status" in query.error && query.error.status === 404);
  return {
    product: parsed?.success ? parsed.data : null,
    loading: query.isLoading,
    notFound,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a product record the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
