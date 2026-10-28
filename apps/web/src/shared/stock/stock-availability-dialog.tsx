import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/shared/detail/tabs";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1MaterialByMaterialIdStockAcrossWarehousesQuery, useGetApiV1MaterialByMaterialIdStockPipelineQuery } from "./stock-api";
import { pipelineSchema, warehouseStockSchema, type WarehouseStock } from "./stock-schema";

type Tab = "current" | "incoming";
const tabs = [{ id: "current" as const, label: "Held now" }, { id: "incoming" as const, label: "On its way in" }];
const sum = (rows: readonly WarehouseStock[], pick: (row: WarehouseStock) => number) => rows.reduce((total, row) => total + pick(row), 0);

function Problem({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{message}<Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button></p>;
}

/** Where else the company holds a material, and what is already on order: what to check before buying more. */
export interface StockMaterial { id: string; name: string; code: string | null; unit: string | null }

/** `audit` names the screen the dialog is opened from, for the server's audit trail. */
export function StockAvailabilityDialog({ material, audit, onClose }: { material: StockMaterial; audit: { module: string; subModule: string }; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("current");
  const stock = useGetApiV1MaterialByMaterialIdStockAcrossWarehousesQuery({ ...audit, materialId: material.id });
  const pipeline = useGetApiV1MaterialByMaterialIdStockPipelineQuery({ ...audit, materialId: material.id });
  const stores = useMemo(() => { const parsed = warehouseStockSchema.safeParse(stock.data ?? null); return parsed.success ? parsed.data : []; }, [stock.data]);
  const incoming = useMemo(() => { const parsed = pipelineSchema.safeParse(pipeline.data ?? null); return parsed.success ? parsed.data : []; }, [pipeline.data]);
  const show = (value: number, unit: string | null = material.unit) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
  const groups = [{ label: "Stores", rows: stores.filter((row) => !row.onFloor) }, { label: "Production floors", rows: stores.filter((row) => row.onFloor) }].filter((group) => group.rows.length > 0);

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>Stock availability · {material.name}</DialogTitle><DialogDescription>{material.code ?? "No code"} · everything the company holds or has on order.</DialogDescription></DialogHeader>
      <DialogBody>
        <Tabs label="Stock availability" tabs={tabs} active={tab} onSelect={setTab}>
          {tab === "current" ? stock.isLoading ? <PageSkeleton label="Loading stock" /> : stock.error ? <Problem message={apiErrorMessage(stock.error)} onRetry={() => void stock.refetch()} />
            : stores.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No store holds this material.</p>
            : <Table><TableHeader><TableRow><TableHead>Store</TableHead><TableHead>Usable</TableHead><TableHead>Expired</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>{groups.map((group) => <Fragment key={group.label}>
                <TableRow className="bg-muted/50"><TableCell colSpan={4} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</TableCell></TableRow>
                {group.rows.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.name}</TableCell><TableCell>{show(row.usable)}</TableCell>
                  <TableCell className={row.expired > 0 ? "text-destructive" : undefined}>{show(row.expired)}</TableCell><TableCell>{show(row.total)}</TableCell></TableRow>)}
                <TableRow className="font-semibold"><TableCell>{group.label} total</TableCell><TableCell>{show(sum(group.rows, (row) => row.usable))}</TableCell>
                  <TableCell>{show(sum(group.rows, (row) => row.expired))}</TableCell><TableCell>{show(sum(group.rows, (row) => row.total))}</TableCell></TableRow>
              </Fragment>)}</TableBody></Table> : null}
          {tab === "incoming" ? pipeline.isLoading ? <PageSkeleton label="Loading incoming stock" /> : pipeline.error ? <Problem message={apiErrorMessage(pipeline.error)} onRetry={() => void pipeline.refetch()} />
            : incoming.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nothing is on order or on its way in.</p>
            : <Table><TableHeader><TableRow><TableHead>Stage</TableHead><TableHead>Reference</TableHead><TableHead>Supplier</TableHead><TableHead>For</TableHead><TableHead>Quantity</TableHead><TableHead>Expected</TableHead></TableRow></TableHeader>
              <TableBody>{incoming.map((row) => <TableRow key={row.id}>
                <TableCell><span className="font-medium">{row.stage}</span><span className="block text-xs text-muted-foreground">{row.status ?? "–"} · {formatDate(row.updated) ?? "date not recorded"}</span></TableCell>
                <TableCell>{row.reference ?? "–"}</TableCell>
                <TableCell>{row.supplier ?? "–"}{row.route ? <span className="block text-xs text-muted-foreground">{row.route}</span> : null}</TableCell>
                <TableCell className="break-words">{row.departments.join(", ") || "–"}</TableCell>
                <TableCell className="font-medium">{show(row.quantity, row.unit ?? material.unit)}</TableCell>
                <TableCell>{formatDate(row.expected) ?? "–"}</TableCell></TableRow>)}</TableBody></Table> : null}
        </Tabs>
      </DialogBody>
    </DialogContent>
  </Dialog>;
}
