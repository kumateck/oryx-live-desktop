import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { Source, comparisonSchema, keys, money, paths, procurementAudit, type ComparisonRow } from "../lib/procurement";

const rowKey = (row: ComparisonRow) => `${row.itemId}|${row.unitId}|${String(row.quantity)}`;

/**
 * Quoted prices side by side, item by item, for trusted vendors or the open market. Choosing one offer per item and
 * creating the memo uses those prices once; the other offers for those items are set aside.
 */
export function PriceComparisonPage() {
  const navigate = useNavigate();
  const { has } = useAccess();
  const canTrusted = has(keys.trustedPricingView);
  const canMarket = has(keys.marketPricingView);
  const [source, setSource] = useState<Source>(canTrusted ? Source.Trusted : Source.OpenMarket);
  const query = inventoryApi.useGetApiV1ProcurementInventoryPriceComparisonQuery({ ...procurementAudit, source }, { refetchOnMountOrArgChange: true });
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryPriceComparisonQuery();
  const [trustedMemo] = inventoryApi.usePostApiV1ProcurementInventoryMemoTrustedVendorMutation();
  const [marketMemo] = inventoryApi.usePostApiV1ProcurementInventoryMemoOpenMarketMutation();
  const parsed = useMemo(() => query.data ? comparisonSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  // The offers as they were when the user confirmed; a fresh read is checked against these, not the refreshed page.
  const [confirming, setConfirming] = useState<typeof selections | null>(null);
  const createKey = source === Source.Trusted ? keys.trustedMemoCreate : keys.marketMemoCreate;
  const viewKey = source === Source.Trusted ? keys.trustedPricingView : keys.marketPricingView;
  const selections = rows.flatMap((row) => { const offer = row.offers.find((o) => o.choice === chosen[rowKey(row)]); return offer ? [{ row, offer }] : []; });
  const totalOf = (chosenOffers: typeof selections) => chosenOffers.reduce((sum, { row, offer }) => sum + row.quantity * offer.price, 0);
  return <section className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">STORE PROCUREMENT</p><h1 className="text-xl font-semibold">Price comparison</h1>
      <p className="text-sm text-muted-foreground">Choose one price per item, then create the memo for what is chosen.</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Source">
        {canTrusted ? <Button size="sm" variant={source === Source.Trusted ? "default" : "outline"} aria-pressed={source === Source.Trusted} onClick={() => { setSource(Source.Trusted); setChosen({}); }}>Trusted vendors</Button> : null}
        {canMarket ? <Button size="sm" variant={source === Source.OpenMarket ? "default" : "outline"} aria-pressed={source === Source.OpenMarket} onClick={() => { setSource(Source.OpenMarket); setChosen({}); }}>Open market</Button> : null}
        {has(createKey) ? <Button size="sm" disabled={selections.length === 0} onClick={() => setConfirming(selections)}>Create memo ({selections.length})</Button> : null}
      </div></header>
    {query.isLoading ? <p className="text-sm text-muted-foreground">Loading prices…</p>
      : query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p>
      : parsed && !parsed.success ? <p role="alert" className="text-sm text-destructive">The server returned prices the app could not read.</p>
      : rows.length === 0 ? <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">No prices are waiting to be compared.</p>
      : <div className="space-y-3">{rows.map((row) => { const key = rowKey(row);
        const best = Math.min(...row.offers.map((o) => o.price));
        return <fieldset key={key} className="space-y-2 rounded-lg border bg-card p-4">
          <legend className="sr-only">{row.name}</legend>
          <div className="flex flex-wrap items-baseline justify-between gap-2"><div><span className="font-medium">{row.name}</span> <span className="font-mono text-xs text-muted-foreground">{row.code}</span></div>
            <span className="text-sm text-muted-foreground">{`${String(row.quantity)} ${row.unit}`.trim()}</span></div>
          <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
            {["", "Vendor", "Unit price", "Total", "Payment", "Delivery"].map((h, i) => <th key={i} scope="col" className="p-2">{h}</th>)}</tr></thead>
            <tbody>{row.offers.map((offer) => <tr key={offer.choice} className="border-b last:border-0">
              <td className="w-8 p-2"><input type="radio" name={key} aria-label={`Choose ${offer.vendorName} for ${row.name}`} checked={chosen[key] === offer.choice} disabled={!has(createKey)}
                onChange={() => setChosen((current) => ({ ...current, [key]: offer.choice }))} /></td>
              <td className="p-2">{offer.vendorName}{offer.price === best && row.offers.length > 1 ? <span className="ml-2 text-xs text-muted-foreground">lowest</span> : null}
                {offer.phone ? <div className="text-xs text-muted-foreground">{offer.phone}</div> : null}</td>
              <td className="p-2">{money(offer.price)}{offer.priceUnit ? ` / ${offer.priceUnit}` : ""}</td><td className="p-2">{money(offer.price * row.quantity)}</td>
              <td className="p-2">{offer.payment ?? "–"}</td><td className="p-2">{offer.delivery ?? "–"}</td></tr>)}</tbody></table></div>
        </fieldset>; })}</div>}
    {confirming ? <ConfirmActionDialog require={{ kind: "all", permissions: [viewKey, createKey] }} destructive={false} title={`Create a memo for ${String(confirming.length)} item(s)?`}
      description={`${confirming.map(({ row, offer }) => `${row.name} from ${offer.vendorName}`).join("; ")}. Total ${money(totalOf(confirming))}. The chosen prices are used once and the other offers for these items are set aside.`}
      confirmLabel="Create memo" busyLabel="Creating…" onClose={() => setConfirming(null)}
      onConfirm={async () => {
        const fresh = await reread({ ...procurementAudit, source }, false);
        const current = fresh.data ? comparisonSchema.safeParse(fresh.data) : null;
        const stillOffered = current?.success && confirming.every(({ row, offer }) => current.data.some((r) => rowKey(r) === rowKey(row) && r.offers.some((o) => o.choice === offer.choice && o.price === offer.price)));
        if (!stillOffered) return "Some chosen prices have changed or been used since you opened this. Close this and choose again.";
        const body = confirming.map(({ row, offer }) => ({ itemId: row.itemId, uoMId: row.unitId, quantity: row.quantity,
          ...(source === Source.Trusted ? { vendorQuotationItemId: offer.choice } : { marketRequisitionVendorId: offer.choice }) }));
        const result = source === Source.Trusted ? await trustedMemo({ ...procurementAudit, body }) : await marketMemo({ ...procurementAudit, body });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Memo created");
        setChosen({});
        if (has(keys.trustedMemoView) || has(keys.marketMemoView)) void navigate(paths.memo);
        return null;
      }} /> : null}
  </section>;
}
