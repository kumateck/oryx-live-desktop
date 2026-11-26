import { formatMonthYear } from "@/shared/format/dates";
import { batchLines, batchPlace } from "../lib/batch-lines";
import { batchNumber, expiredOrDue } from "../lib/stock-issue";
import { issueDifference } from "../lib/issue-quantity";
import type { StockLine } from "../schemas/stock-issue-schema";
import { amount, conversionNote } from "./batch-breakdown";

const tick = <span aria-label="To tick when picked" className="voucher-tick" />;

/**
 * The voucher's materials: each material and its required quantity once, beside one line per batch to pick (batch, AR number,
 * location, quantity from it, expiry and a box to tick). Several batches end with their total; a shortfall is printed.
 * A material's lines stay together on a page.
 */
export function VoucherTable({ lines }: { lines: readonly StockLine[] }) {
  return <table className="print-table voucher-table">
    <thead><tr>
      <th scope="col" style={{ width: "4%" }}>#</th><th scope="col" style={{ width: "21%" }}>Material</th><th scope="col" style={{ width: "10%", textAlign: "right" }}>Qty required</th>
      <th scope="col" style={{ width: "13%" }}>Batch No.</th><th scope="col" style={{ width: "14%" }}>AR No.</th><th scope="col" style={{ width: "14%" }}>Location</th>
      <th scope="col" style={{ width: "10%", textAlign: "right" }}>Qty from batch</th><th scope="col" style={{ width: "9%" }}>Expiry</th><th scope="col" style={{ width: "5%", textAlign: "center" }}>✓</th>
    </tr></thead>
    {lines.length === 0 ? <tbody><tr><td colSpan={9} className="print-empty">No materials on this requisition</td></tr></tbody>
      : lines.map((line, index) => { const { batches, total, short, totalLine, conversion } = batchLines(line);
        const span = Math.max(batches.length, 1) + (totalLine ? 1 : 0) + (conversion ? 1 : 0);
        const material = <>
          <td rowSpan={span}>{index + 1}</td>
          <td rowSpan={span}>{line.materialName}<small>{line.materialCode ?? "No code"}</small>{line.substituteFor ? <small>Substitute for {line.substituteFor}</small> : null}</td>
          <td rowSpan={span} style={{ textAlign: "right" }}>{amount(line.quantity, line.unit)}
            {line.approvedQuantity !== null ? <small>Originally approved: {amount(line.approvedQuantity, line.unit)}; repaired after issue</small> : null}
            {line.issuedQuantity !== null && issueDifference(line) !== 0 ? <>
              <small><strong>{line.issued ? "Issued" : "To issue"} {amount(line.issuedQuantity, line.unit)}: {amount(Math.abs(issueDifference(line)), line.unit)} {issueDifference(line) > 0 ? "over" : "under"}</strong></small>
              {line.adjustmentReason ? <small>Reason: {line.adjustmentReason}</small> : null}</> : null}</td></>;
        return <tbody key={line.id} className="voucher-material">
          {batches.length === 0 ? <tr>{material}<td colSpan={5}>None set aside<small>{amount(line.quantity, line.unit)} short</small></td><td /></tr>
            : batches.map((batch, position) => { const number = batchNumber(batch.number); const expired = expiredOrDue(batch.expires);
              return <tr key={batch.key}>{position === 0 ? material : null}
                <td>{number === "–" ? "No batch" : number}{batch.returned ? <small>Returned stock</small> : null}</td>
                <td>{batch.arNumber ?? "Not recorded"}</td>
                <td>{batchPlace(batch)}</td>
                <td style={{ textAlign: "right" }}>{amount(batch.quantity, batch.unit ?? line.unit)}</td>
                <td>{batch.expires ? `${expired ? "Expired " : ""}${formatMonthYear(batch.expires) ?? ""}` : "No expiry"}</td>
                <td style={{ textAlign: "center" }}>{tick}</td></tr>; })}
          {totalLine ? <tr className="voucher-total">
            <td colSpan={3} style={{ textAlign: "right" }}>{short > 0 ? "Set aside" : "Total"}</td>
            <td style={{ textAlign: "right" }}>{conversion ? amount(conversion.total, conversion.unit) : amount(total, line.unit)}</td>
            <td colSpan={2}>{short > 0 ? `${amount(short, line.unit)} short` : null}</td></tr> : null}
          {conversion ? <tr className="voucher-total">
            <td colSpan={6} style={{ textAlign: "right" }}><small>{conversionNote(line.issued ? line.issuedQuantity ?? line.quantity : line.quantity, line.unit, conversion)}</small></td></tr> : null}
        </tbody>; })}
  </table>;
}
