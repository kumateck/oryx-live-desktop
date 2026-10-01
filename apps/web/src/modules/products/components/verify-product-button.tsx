import { BadgeCheck, BadgeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1VerificationMutation } from "../api/product-api";
import { audit, productEntity } from "../lib/product-access";
import type { ProductRow } from "../schemas/product-schema";

/** Marks a product as checked by quality. Shown only to users who may verify, and only while unchecked. */
export function VerifyProductButton({ product }: { product: Pick<ProductRow, "id" | "name" | "isVerified"> }) {
  const [verify, mutation] = usePostApiV1VerificationMutation();
  if (product.isVerified) return null;
  const run = async () => {
    const result = await verify({ ...audit, sharedRequestsVerifyRequest: { modelId: product.id, modelType: productEntity } });
    if ("error" in result) toast.error(`${product.name ?? "Product"} was not verified`, { description: apiErrorMessage(result.error) });
    else toast.success(`${product.name ?? "Product"} was verified`);
  };
  return <Button type="button" size="sm" variant="outline" disabled={mutation.isLoading} onClick={() => void run()}
    aria-label={`Verify ${product.name ?? "product"}`}>{mutation.isLoading ? <Spinner /> : <BadgeCheck />}Verify</Button>;
}

export function QualityBadge({ verified }: { verified: boolean }) {
  return verified
    ? <span className="inline-flex items-center gap-1 text-success"><BadgeCheck aria-hidden="true" className="size-4" />Verified</span>
    : <span className="inline-flex items-center gap-1 text-muted-foreground"><BadgeX aria-hidden="true" className="size-4" />Not verified</span>;
}
