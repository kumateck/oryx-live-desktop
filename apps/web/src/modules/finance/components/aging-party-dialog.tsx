import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import type { AgingParty } from "../api/finance-api";
import { labelFor, payableTypes } from "../lib/payments";
const buckets = ["Current", "0–30 days", "31–60 days", "61–90 days", "Over 90 days", "Due date unknown"];
export function AgingPartyDialog({ party, currency, onClose }: { party: AgingParty; currency: string; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-3xl">
    <DialogHeader><DialogTitle>{party.partyName ?? "Outstanding documents"}</DialogTitle><DialogDescription>{formatMoney(party.totalOutstandingBase, currency)} outstanding in reporting currency.</DialogDescription></DialogHeader>
    <DialogBody className="space-y-4">{(party.lines ?? []).map((line, index) => <section key={`${line.payableId ?? "line"}:${index}`} className="space-y-2 border-b pb-3 last:border-0">
      <h2 className="font-semibold break-words">{line.documentCode ?? line.payableId ?? "Unnumbered document"}</h2>
      <dl className="grid gap-2 sm:grid-cols-3"><div><dt className="text-muted-foreground">Document type</dt><dd>{labelFor(payableTypes, line.payableType)}</dd></div><div><dt className="text-muted-foreground">Due date</dt><dd>{formatDate(line.dueDate) ?? "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Aging bucket</dt><dd>{labelFor(buckets, line.bucket)}</dd></div><div><dt className="text-muted-foreground">Original outstanding</dt><dd>{formatMoney(line.originalOutstanding, line.currencyName)}</dd></div><div><dt className="text-muted-foreground">Rate to base</dt><dd>{line.rateToBase ?? "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Outstanding in base</dt><dd>{formatMoney(line.outstandingBase, currency)}</dd></div></dl>
    </section>)}{!party.lines?.length ? <p>No document breakdown returned.</p> : null}</DialogBody>
    <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}
