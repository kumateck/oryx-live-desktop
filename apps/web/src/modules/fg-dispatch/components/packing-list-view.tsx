import { Fragment } from "react";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures } from "@/shared/print/print-sheet";
import { packingGroups, packingRows, packingTotals } from "../lib/dispatch";
import type { Allocation } from "../schemas/dispatch-schema";

const heads = ["#", "Product", "Batch", "Made", "Expires", "Pack size", "Per shipper", "Shippers", "Loose", "Total packs"];
function Rows({ allocation, print }: { allocation: Allocation; print: boolean }) {
  const rows = packingRows(allocation.products.map((product) => ({ name: product.name, sources: product.sources })));
  const totals = packingTotals(rows);
  const right = print ? { textAlign: "right" as const } : undefined;
  let number = 0;
  return <table className={print ? "print-table" : "w-full min-w-[820px] text-sm"}><caption className={print ? undefined : "sr-only"}>Packing list</caption>
    <thead><tr className={print ? undefined : "border-b text-left text-xs text-muted-foreground"}>{heads.map((head, index) => <th key={head} scope="col" style={index > 5 ? right : undefined} className={print ? undefined : `py-1.5 font-medium ${index > 5 ? "text-right" : ""}`}>{head}</th>)}</tr></thead>
    <tbody>{rows.length === 0 ? <tr><td colSpan={10} className={print ? "print-empty" : "py-4 text-center text-muted-foreground"}>No batches on this packing list.</td></tr> : packingGroups(rows).map((group) => <Fragment key={group.product}>
      {group.rows.map((row) => { number += 1; const cell = print ? undefined : "py-1.5";
        return <tr key={row.key} className={print ? undefined : "border-b"}><td className={cell}>{number}</td><td className={cell}>{row.product}</td><td className={cell}>{row.batch ?? "–"}</td><td className={cell}>{formatMonthYear(row.made) ?? "–"}</td><td className={cell}>{formatMonthYear(row.expires) ?? "–"}</td>
          <td className={cell}>{row.packing ?? "–"}</td><td style={right} className={print ? undefined : "py-1.5 text-right"}>{row.perShipper || "–"}</td><td style={right} className={print ? undefined : "py-1.5 text-right"}>{row.shippers}</td>
          <td style={right} className={print ? undefined : "py-1.5 text-right"}>{row.loose}</td><td style={right} className={print ? undefined : "py-1.5 text-right font-medium"}>{row.packs.toLocaleString()}</td></tr>; })}
      {group.subtotal !== null ? <tr className={print ? undefined : "border-b bg-muted/40"}><td colSpan={9} style={right} className={print ? undefined : "py-1.5 text-right text-xs font-medium"}>Subtotal · {group.product}</td>
        <td style={right} className={print ? undefined : "py-1.5 text-right font-semibold"}>{group.subtotal.toLocaleString()}</td></tr> : null}</Fragment>)}</tbody>
    {rows.length > 0 ? <tfoot><tr><td colSpan={7} style={right} className={print ? undefined : "py-1.5 text-right font-medium"}>Total</td><td style={right} className={print ? undefined : "py-1.5 text-right font-medium"}>{totals.shippers}</td>
      <td style={right} className={print ? undefined : "py-1.5 text-right font-medium"}>{totals.loose}</td><td style={right} className={print ? undefined : "py-1.5 text-right font-semibold"}>{totals.packs.toLocaleString()}</td></tr></tfoot> : null}
  </table>;
}

/** The batches packed for a customer's order, product by product, with a subtotal where a product comes from several batches. */
export function PackingListTable({ allocation }: { allocation: Allocation }) {
  return <div className="overflow-x-auto rounded-lg border bg-card p-3"><Rows allocation={allocation} print={false} /></div>;
}

/** The packing list as the document that travels with the goods. Printing can also save it as a PDF. */
export function PackingListPrint({ allocation, onClose }: { allocation: Allocation; onClose: () => void }) {
  return <PrintPreviewDialog title={`Packing list · ${allocation.orderCode ?? ""}`} note="Choose Save as PDF in the print window to keep a copy." onClose={onClose}>
    <PrintHeader title="Packing list" reference={allocation.orderCode} />
    <PrintFacts facts={[{ label: "To", value: allocation.customer.name }, { label: "Address", value: allocation.customer.address }, { label: "Date", value: formatDate(new Date().toISOString()) },
      { label: "Packing list no.", value: allocation.orderCode }, { label: "Invoice", value: allocation.invoiceCode }, { label: "Vehicle no.", value: "____________________" }]} />
    <Rows allocation={allocation} print />
    <PrintSignatures roles={["Warehouse supervisor", "Auditor", "Control"]} />
  </PrintPreviewDialog>;
}
