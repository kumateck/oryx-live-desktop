import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useMemo } from "react";
import { useGetApiV1RequisitionSourceMaterialPriceComparisonQuery } from "@/modules/price-comparison/api/comparison-api";
import { comparisonSchema } from "@/modules/price-comparison/schemas/comparison-schema";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { useRecordPrices } from "../hooks/use-record-prices";
import { correctableLineIds } from "../lib/open-lines";
import { audit } from "../lib/quotation-response-access";
import type { SupplierQuotation } from "../schemas/quotation-response-schema";
import { AgreementStep } from "./agreement-step";
import { PriceLinesTable } from "./price-lines-table";

const nothingInvalid = new Map<string, "price" | "priceUnit">();

/**
 * Records the prices a supplier quoted. For a quotation already recorded it shows them, and lets someone
 * who may record prices correct the lines still waiting in price comparison. `inView` is the page of
 * quotations this one was opened from.
 */
export function RecordPricesDialog({ quotation, type, inView, mayRecord, onClose }: { quotation: SupplierQuotation; type: SupplierType; inView: readonly SupplierQuotation[]; mayRecord: boolean; onClose: () => void }) {
  const correcting = mayRecord && quotation.received;
  const comparison = useGetApiV1RequisitionSourceMaterialPriceComparisonQuery({ ...audit, supplierType: type }, { skip: !correcting, refetchOnMountOrArgChange: true });
  const open = useMemo(() => { const parsed = comparisonSchema.safeParse(comparison.data ?? null); return correcting && parsed.success ? correctableLineIds(quotation, parsed.data, inView) : new Set<string>(); }, [comparison.data, correcting, quotation, inView]);
  const locked = useMemo(() => new Set(quotation.items.filter((item) => !open.has(item.id)).map((item) => item.id)), [quotation, open]);
  const record = useRecordPrices(quotation, type, onClose, correcting ? open : null);
  const editable = mayRecord && (!quotation.received || open.size > 0);
  const currency = quotation.supplier.currency;
  const checking = correcting && comparison.isLoading;
  return <Dialog open onOpenChange={(next) => { if (!next && !record.saving) onClose(); }}>
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader><DialogTitle>{record.changes ? "Standing price agreements" : correcting && editable ? "Correct quoted prices" : editable ? "Record quoted prices" : "Quoted prices"}</DialogTitle>
        <DialogDescription>{record.changes ? "Decide whether these prices also become the supplier's agreed prices."
          : correcting ? checking ? "Checking which prices can still be corrected…" : open.size === 0 ? "These prices can no longer be corrected: none of the lines is still waiting in price comparison."
            : locked.size > 0 ? `${open.size} of ${quotation.items.length} lines are still in price comparison and can be corrected. The rest are already awarded or closed.` : "These lines are still in price comparison, so their prices can be corrected."
          : editable ? "Enter the price the supplier quoted for each material, and the unit it is priced per." : quotation.received ? "These prices are recorded." : "Prices have not been recorded yet."}</DialogDescription></DialogHeader>
      {record.changes ? <AgreementStep changes={record.changes} currency={currency} saving={record.saving} message={record.message}
        onBack={record.backToPrices} onRecordOnly={() => void record.recordOnly()} onSubmit={(date) => void record.submitWithAgreements(date)} /> : <>
        <DialogBody className="space-y-4">
          <SupplierSummary supplier={quotation.supplier} />
          {record.lines ? <PriceLinesTable lines={record.lines} currency={currency} invalid={editable ? record.invalid : nothingInvalid} disabled={record.saving} locked={correcting ? locked : undefined} onChange={editable ? record.change : null} />
            : <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading prices…</p>}
          {record.problems.length > 0 ? <ul role="alert" className="list-disc space-y-0.5 pl-5 text-sm text-destructive">{record.problems.map((problem) => <li key={problem.id}>{problem.message}</li>)}</ul> : null}
          {record.toVerify ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="flex items-center gap-2 font-semibold text-destructive"><TriangleAlert className="size-4 shrink-0" />{record.toVerify.length === 1 ? "Check this line before recording" : `Check these ${record.toVerify.length} lines before recording`}</p>
            <p className="mt-1 text-xs text-muted-foreground">The quantity is a tiny fraction of the unit the price is quoted in, so the line is worth almost nothing. Correct the unit, or confirm that both are right.</p>
            <ul className="mt-2 space-y-1 text-sm">{record.toVerify.map((line) => <li key={line.id}><span className="font-medium">{line.materialName}</span>: {line.text}</li>)}</ul></div> : null}
          {record.message ? <p role="alert" className="text-sm text-destructive">{record.message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={record.saving} onClick={onClose}>{editable ? "Cancel" : "Close"}</Button>
          {editable ? <Button type="button" disabled={record.saving || record.loading || checking} onClick={() => void record.submitPrices()}>
            {record.saving ? <><Spinner />Saving…</> : record.toVerify ? (correcting ? "Confirm and save" : "Confirm and record") : correcting ? "Save corrections" : "Record prices"}</Button> : null}
        </DialogFooter></>}
    </DialogContent>
  </Dialog>;
}
