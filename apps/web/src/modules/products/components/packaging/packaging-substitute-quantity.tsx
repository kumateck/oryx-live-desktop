import type { UseFormReturn } from "react-hook-form";
import { useMaterialUnit } from "../../hooks/use-material-unit";
import { packagingAudit } from "../../hooks/use-packaging";
import type { PackagingItemFormValues } from "../../schemas/packaging-schema";
import { MaterialQuantityFields, type MaterialQuantityField } from "../material-quantity-fields";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { Button } from "@/components/ui/button";

export function PackagingSubstituteQuantity({ form, substitute }: { form: UseFormReturn<PackagingItemFormValues>; substitute: { value: string; label: string } }) {
  const linked = useMaterialUnit(substitute.value, null, packagingAudit);
  if (linked.status === "loading") return <Skeleton className="h-14" />;
  if (!linked.unit) return <div role="alert" className="space-y-2 text-sm"><p>Set a stock unit for {substitute.label} before saving its quantity.</p><Button variant="outline" type="button" onClick={linked.retry}>Retry unit</Button></div>;
  const fields: readonly MaterialQuantityField<PackagingItemFormValues>[] = [{ name: `substituteQuantities.${substitute.value}`, label: `Substitute quantity for ${substitute.label}`, required: true }];
  return <MaterialQuantityFields form={form} unit={linked.unit} fields={fields} description={`Quantity of ${substitute.label} that replaces this packing material.`} />;
}
