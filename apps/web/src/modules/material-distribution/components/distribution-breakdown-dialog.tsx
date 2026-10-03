import { Factory, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatUnitPrice } from "@/shared/procurement/price";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { toLargestUnit } from "@/shared/units/quantity";
import { progressLabel, requestStatusLabels, sectionProgress, sharePercent, supplyChain } from "../lib/distribution";
import type { DistributionSection, DistributionShare } from "../schemas/distribution-schema";

const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

function DepartmentCard({ share, unit }: { share: DistributionShare; unit: string | null }) {
  const percent = sharePercent(share);
  return <li className="space-y-2 rounded-lg border p-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><h4 className="break-words text-sm font-semibold">{share.department}</h4>
        <p className="break-words text-xs text-muted-foreground">{[share.departmentCode, share.departmentDescription].filter(Boolean).join(" · ") || "No code"}</p></div>
      <Badge variant={percent >= 100 ? "default" : percent > 0 ? "secondary" : "outline"}>{percent}%</Badge>
    </div>
    <p className="text-xs text-muted-foreground">Request {share.requestStatus === null ? "status not recorded" : (requestStatusLabels[share.requestStatus] ?? "status unknown").toLowerCase()}
      {share.asked === null ? "" : ` · originally asked for ${show(share.asked, share.askedUnit)}`}</p>
    <dl className="grid grid-cols-3 gap-2 text-center text-sm">
      <div className="rounded border p-2"><dt className="text-xs text-muted-foreground">Requested</dt><dd className="font-semibold">{show(share.requested, unit)}</dd></div>
      <div className="rounded border p-2"><dt className="text-xs text-muted-foreground">Allocated</dt><dd className="font-semibold">{show(share.allocated, unit)}</dd></div>
      <div className="rounded border p-2"><dt className="text-xs text-muted-foreground">Remaining</dt><dd className="font-semibold">{show(share.remaining, unit)}</dd></div>
    </dl>
    {share.sources.length > 0 ? <div className="space-y-1"><h5 className="text-xs font-medium">Distribution sources ({share.sources.length})</h5>
      <ul className="space-y-1">{share.sources.map((source) => <li key={source.key} className="rounded border bg-muted/40 p-2 text-xs">
        <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{source.materialCode ?? "No code"}</span><span className="font-medium">{show(source.quantity, source.unit)}</span></div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
          {source.manufacturer ? <span className="flex items-center gap-1"><Factory className="size-3" />{source.manufacturer}</span> : null}
          {source.order ? <span className="flex items-center gap-1"><FileText className="size-3" />PO {source.order}</span> : null}
          {source.price !== null ? <span>{formatUnitPrice(source.price, source.currency, source.priceUnit)}</span> : null}
          <span>Expected {show(source.expected, source.unit)}</span><span>Received {show(source.received, source.unit)}</span>
        </div></li>)}</ul></div> : null}
  </li>;
}

/** Everything about one material of a delivery: what arrived against what was asked, where it came from, and each department's part. */
export function DistributionBreakdownDialog({ section, onClose, action }: { section: DistributionSection; onClose: () => void; action?: React.ReactNode }) {
  const progress = sectionProgress(section);
  const chain = supplyChain(section);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle>{section.materialName}</DialogTitle>
        <DialogDescription>{[section.materialCode ?? "No code", section.materialKind === null ? null : `${materialKindLabels[section.materialKind]} material`, progressLabel(progress.percent)].filter(Boolean).join(" · ")}</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        {section.materialDescription ? <RichTextView html={section.materialDescription} className="text-sm" /> : null}
        <KeyFacts>
          <KeyFact label="Supplied" value={show(section.arrived, section.unit)} />
          <KeyFact label="Requested" value={show(progress.requested, section.unit)} />
          <KeyFact label="Allocated" value={show(progress.allocated, section.unit)} />
          <KeyFact label="Remaining" value={show(progress.remaining, section.unit)} />
          <KeyFact label="Progress" value={`${progress.percent}%`} note={`${section.shares.length} ${section.shares.length === 1 ? "department" : "departments"}`} />
        </KeyFacts>
        <section className="rounded-lg border bg-card p-3 text-sm"><h3 className="mb-1 text-sm font-semibold">Supply chain</h3>
          <p><span className="text-muted-foreground">Manufacturers: </span>{chain.manufacturers.join(", ") || "–"}</p>
          <p><span className="text-muted-foreground">Purchase orders: </span>{chain.orders.join(", ") || "–"}</p>
          {chain.averagePrice !== null ? <p><span className="text-muted-foreground">Average unit price: </span>{formatUnitPrice(Number(chain.averagePrice.toFixed(4)), chain.currency, chain.priceUnit)}</p> : null}</section>
        <section className="space-y-2"><h3 className="text-sm font-semibold">Department allocation</h3>
          <ul className="grid gap-2 lg:grid-cols-2">{section.shares.map((share) => <DepartmentCard key={share.key} share={share} unit={section.unit} />)}</ul></section>
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button>{action}</DialogFooter>
    </DialogContent>
  </Dialog>;
}
