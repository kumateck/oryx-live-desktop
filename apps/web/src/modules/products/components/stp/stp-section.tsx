import { Button } from "@/components/ui/button";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useProductStp } from "../../hooks/use-product-stp";
import { StpForm } from "./stp-form";

export function StpSection({ productId }: { productId: string }) {
  const state = useProductStp(productId);
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">Standard test procedure</h2>
      <p className="text-xs text-muted-foreground">{state.stp ? "The product's STP and its controlled document." : "This product has no STP yet. Creating one attaches its first document."}</p></div>
    {state.loading ? <FormPageSkeleton label="Loading standard test procedure" sections={[3]} />
      : state.error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{state.error}
        <Button type="button" size="sm" variant="outline" onClick={state.retry}>Retry</Button></div>
      // Keyed by the STP so the form starts again from the saved record once one is created.
      : <StpForm key={state.stp?.id ?? "new"} state={state} />}
  </section>;
}
