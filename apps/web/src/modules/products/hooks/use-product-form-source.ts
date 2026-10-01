import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdQuery } from "../api/product-api";
import { audit } from "../lib/product-access";
import { productFormSourceSchema } from "../schemas/product-form-schema";

/** The saved product, in the shape the edit form starts from. */
export function useProductFormSource(productId: string | undefined) {
  const query = useGetApiV1ProductByProductIdQuery({ ...audit, productId: productId ?? "" }, { skip: !productId });
  const parsed = useMemo(() => query.data ? productFormSourceSchema.safeParse(query.data) : null, [query.data]);
  return {
    product: parsed?.success ? parsed.data : null,
    loading: query.isLoading,
    notFound: Boolean(query.error && "status" in query.error && query.error.status === 404),
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a product record the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
