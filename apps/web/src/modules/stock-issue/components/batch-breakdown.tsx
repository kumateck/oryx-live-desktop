import { cn } from "cn";
import { formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { batchLines, batchPlace, type BatchUnitConversion, type SetAsideBatch } from "../lib/batch-lines";
import { batchNumber, expiredOrDue } from "../lib/stock-issue";

export const amount = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** "Requested 652.1739 ml at a density of 1.15 g/mL = 750 g": how the line's quantity becomes the batches' unit. */
export function conversionNote(quantity: number, unit: string | null, conversion: BatchUnitConversion): string {
  const density = conversion.density !== null ? ` at a density of ${conversion.density} g/mL` : "";
  return `Requested ${amount(quantity, unit)}${density} = ${amount(conversion.required, conversion.unit)}`;
}

/** "Expires Mar 2030", or "Expired …" for a batch past its date. */
function Expiry({ expires }: { expires: string | null }) {
  const expired = expiredOrDue(expires);
  return <span className={cn(expired && "font-medium text-destructive")}>{expires ? `${expired ? "Expired " : ""}${formatMonthYear(expires) ?? ""}` : "No expiry date"}</span>;
}

/**
 * The batches set aside for a line, one row each in picking order: batch, AR number, where to pick it, how much and when it
 * expires. Several batches end with what they add up to; a shortfall is said plainly.
 */
export function BatchBreakdown({ line }: { line: { quantity?: number; unit: string | null; density?: number | null; issuedQuantity?: number | null; issued?: boolean; batches: readonly SetAsideBatch[] } }) {
  if (line.batches.length === 0) return <span className="text-sm text-destructive">No stock set aside</span>;
  const { batches, total, short, totalLine, conversion } = batchLines({ ...line, quantity: line.quantity ?? 0 });
  return <div role="region" aria-label="Batch details" tabIndex={0} data-row-click="ignore"
    className="w-full min-w-0 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring">
    <table className="w-full min-w-[32rem] table-fixed border-collapse text-sm">
    <thead className="text-xs text-muted-foreground"><tr>
      <th scope="col" className="w-[24%] px-2 py-1 text-left font-medium">Batch No.</th><th scope="col" className="w-[22%] px-2 py-1 text-left font-medium">AR No.</th>
      <th scope="col" className="w-[24%] px-2 py-1 text-left font-medium">Location</th><th scope="col" className="w-[14%] px-2 py-1 text-right font-medium">Quantity</th>
      <th scope="col" className="w-[16%] px-2 py-1 text-left font-medium">Expiry</th></tr></thead>
    <tbody>{batches.map((batch) => { const number = batchNumber(batch.number);
      return <tr key={batch.key} className={cn("border-t", expiredOrDue(batch.expires) && "bg-destructive/5")}>
        <td className="break-words px-2 py-1 font-medium">{number === "–" ? "No batch" : number}{batch.returned ? <span className="ml-1.5 rounded bg-muted px-1 text-xs font-normal">Returned stock</span> : null}</td>
        <td className="break-words px-2 py-1">{batch.arNumber || <span className="text-muted-foreground">Not recorded</span>}</td>
        <td className="break-words px-2 py-1">{batchPlace(batch)}</td>
        <td className="px-2 py-1 text-right tabular-nums">{amount(batch.quantity, batch.unit ?? line.unit)}</td>
        <td className="px-2 py-1"><Expiry expires={batch.expires} /></td></tr>; })}
      {totalLine && line.quantity !== undefined ? <tr className="border-t">
        <td colSpan={3} className="px-2 py-1 text-right text-xs text-muted-foreground">{short > 0 ? "Set aside" : "Total"}</td>
        <td className="px-2 py-1 text-right font-semibold tabular-nums">{conversion ? amount(conversion.total, conversion.unit) : amount(total, line.unit)}</td>
        <td className="px-2 py-1 text-xs">{short > 0 ? <span className="font-medium text-destructive">{amount(short, line.unit)} short</span> : null}</td></tr> : null}
      {conversion && line.quantity !== undefined ? <tr>
        <td colSpan={5} className="px-2 pb-1 text-right text-xs text-muted-foreground">{conversionNote(line.issued ? line.issuedQuantity ?? line.quantity : line.quantity, line.unit, conversion)}</td></tr> : null}
    </tbody>
    </table>
  </div>;
}
