import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import type { ProductOptions } from "../../hooks/use-product-options";

/** Field counts of the product form's sections, so its placeholder has the same shape. */
export const productFormSections = [6, 3, 5, 5, 1] as const;

/** Loading and failure states of the form's reference lists, then the form itself. */
export function ProductFormShell({ options, children }: { options: ProductOptions; children: ReactNode }) {
  if (options.loading) return <FormPageSkeleton label="Loading form" sections={productFormSections} />;
  if (options.error) return <div role="alert" className="space-y-2 text-sm">
    <p>The form's lists (categories, units, departments, equipment) could not be loaded. {options.error}</p>
    <Button type="button" size="sm" variant="outline" onClick={options.retry}>Retry</Button>
  </div>;
  return children;
}

export function FormActions({ saving, saveLabel, savingLabel, onCancel, error }: {
  saving: boolean; saveLabel: string; savingLabel: string; onCancel: () => void; error: string;
}) {
  return <div className="space-y-2">
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
      <Button type="submit" disabled={saving}>{saving ? <><Spinner />{savingLabel}</> : saveLabel}</Button>
    </div>
  </div>;
}
