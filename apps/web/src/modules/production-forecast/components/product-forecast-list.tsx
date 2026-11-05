import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { batchSizeLabel, readiness } from "../lib/forecast";
import type { ForecastProduct } from "../schemas/forecast";
import { MaterialTable } from "./material-table";

/** Each planned product (product, batch size and packing style) with its expandable material forecast. */
export function ProductForecastList({ products }: { products: ForecastProduct[] }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) => setOpen((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  return <section className="space-y-2" aria-labelledby="forecast-products">
    <h2 id="forecast-products" className="text-base font-semibold">Material forecast by product</h2>
    <ul className="space-y-2">{products.map((product) => {
      const expanded = open.has(product.key);
      const state = readiness(product);
      const name = product.productName || product.productCode || "Unnamed product";
      return <li key={product.key} className="ui-card border bg-card">
        <button type="button" className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-left" aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} materials for ${name}`} onClick={() => toggle(product.key)}>
          {expanded ? <ChevronDown className="size-4 shrink-0" aria-hidden /> : <ChevronRight className="size-4 shrink-0" aria-hidden />}
          <span className="min-w-0 flex-1"><span className="block break-words font-medium">{name}</span>
            <span className="block text-xs text-muted-foreground">{[product.productCode, batchSizeLabel(product.batchSize), product.packingStyle || "No packing style"].filter(Boolean).join(" · ")}</span></span>
          <span className="text-right"><Badge variant={state.short ? "destructive" : "secondary"}>{state.text}</Badge>
            <span className="block text-xs text-muted-foreground">{state.detail}</span></span>
        </button>
        {expanded ? <div className="mt-3 space-y-4">
          {product.warnings.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{product.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
          <MaterialTable title="Raw materials" materials={product.rawMaterials} batchCount={product.batchCount} />
          <MaterialTable title="Packaging materials" materials={product.packagingMaterials} batchCount={product.batchCount} />
        </div> : null}
      </li>;
    })}</ul>
  </section>;
}
