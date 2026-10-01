import { Button } from "@/components/ui/button";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { usePackingOrder } from "../../hooks/use-packing-order";
import { PackingOrderForm } from "./packing-order-form";

export function PackingOrderSection({ productId }: { productId: string }) {
  const order = usePackingOrder(productId);
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">Packing order</h2>
      <p className="text-xs text-muted-foreground">Instructions for preparing each level of the product's packaging. They are printed on the batch packaging record.</p></div>
    {order.loading ? <FormPageSkeleton label="Loading packing order" sections={[3]} columns="grid-cols-1" />
      : order.error || !order.saved ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{order.error ?? "The packing order could not be loaded."}
        <Button type="button" size="sm" variant="outline" onClick={order.retry}>Retry</Button></div>
      : <PackingOrderForm saved={order.saved} saving={order.saving} message={order.message} onSave={order.save} />}
  </section>;
}
