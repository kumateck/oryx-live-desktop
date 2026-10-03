import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { lineCost } from "@/shared/procurement/price";
import { convertUnit, formatQuantityNumber, relatedUnits } from "@/shared/units/quantity";
import { invoiceableStatuses } from "./invoice-access";

/** One purchase order line being invoiced. The quantity is typed in `enteredUnit`, the largest of the line's family. */
export interface InvoiceLine {
  key: string; orderId: string; orderCode: string; materialId: string; materialName: string; materialCode: string | null; unit: string | null; unitId: string;
  ordered: number; invoiced: number; remaining: number; price: number | null; priceUnit: string | null; enteredUnit: string;
  quantity: number | null; manufacturerId: string | null; manufacturers: readonly { value: string; label: string }[]; reason: string; included: boolean;
}

/** Orders that can still be invoiced: sent, with at least one line not yet fully invoiced. */
export function invoiceableOrders(orders: readonly PurchaseOrder[]): PurchaseOrder[] {
  return orders.filter((order) => invoiceableStatuses.includes(order.status) && order.items.some((line) => line.quantity - line.invoiced > 0));
}

/** The lines of the chosen orders that still have something to invoice, each starting at what remains. */
export function startInvoiceLines(orders: readonly PurchaseOrder[]): InvoiceLine[] {
  return orders.flatMap((order) => order.items.flatMap((line): InvoiceLine[] => {
    const remaining = line.quantity - line.invoiced;
    if (remaining <= 0 || !line.materialId || !line.unitId) return [];
    const enteredUnit = relatedUnits(line.unit).at(-1) ?? line.unit ?? "";
    return [{ key: `${order.id}:${line.materialId}`, orderId: order.id, orderCode: order.code, materialId: line.materialId, materialName: line.materialName, materialCode: line.materialCode, unit: line.unit, unitId: line.unitId,
      ordered: line.quantity, invoiced: line.invoiced, remaining, price: line.price, priceUnit: line.priceUnit, enteredUnit, quantity: convertUnit(remaining, line.unit, enteredUnit) ?? remaining,
      manufacturerId: line.manufacturers[0]?.id ?? null, manufacturers: line.manufacturers.map((item) => ({ value: item.id, label: item.name })), reason: "", included: true }];
  }));
}

/** Keeps what the user has entered when the chosen orders change: lines still present keep their values. */
export function mergeInvoiceLines(current: readonly InvoiceLine[], fresh: readonly InvoiceLine[]): InvoiceLine[] {
  const kept = new Map(current.map((line) => [line.key, line]));
  return fresh.map((line) => { const old = kept.get(line.key); return old ? { ...line, quantity: old.quantity, manufacturerId: old.manufacturerId ?? line.manufacturerId, reason: old.reason, included: old.included } : line; });
}

/** The typed quantity in the unit the line is stored in. */
export function storedQuantity(line: InvoiceLine): number | null {
  return line.quantity === null ? null : convertUnit(line.quantity, line.enteredUnit, line.unit) ?? line.quantity;
}
export function invoiceLineCost(line: InvoiceLine): number | null {
  const quantity = storedQuantity(line);
  return quantity === null ? null : lineCost({ quantity, unit: line.unit, price: line.price, priceUnit: line.priceUnit });
}

export interface InvoiceLineProblem { key: string | null; message: string }

/** What stops the invoice, checked the way the server checks it. */
export function invoiceLineProblems(lines: readonly InvoiceLine[]): InvoiceLineProblem[] {
  const included = lines.filter((line) => line.included);
  if (included.length === 0) return [{ key: null, message: "Keep at least one line on the invoice" }];
  return included.flatMap((line): InvoiceLineProblem[] => {
    const quantity = storedQuantity(line);
    const left = `${formatQuantityNumber(convertUnit(line.remaining, line.unit, line.enteredUnit) ?? line.remaining, "calculated")} ${line.enteredUnit}`;
    if (quantity === null || !(quantity > 0)) return [{ key: line.key, message: `Enter how much ${line.materialName} is invoiced, or leave the line off` }];
    if (quantity > line.remaining) return [{ key: line.key, message: `${line.materialName}: only ${left} of ${line.orderCode} is left to invoice` }];
    if (!line.manufacturerId) return [{ key: line.key, message: `Choose the manufacturer of ${line.materialName}` }];
    if (quantity < line.remaining && !line.reason.trim()) return [{ key: line.key, message: `${line.materialName}: say why less than the ${left} left on ${line.orderCode} is invoiced` }];
    return [];
  });
}

export function invoiceRequest(code: string, supplierId: string, lines: readonly InvoiceLine[]) {
  return { code: code.trim(), supplierId, items: lines.filter((line) => line.included).flatMap((line) => { const quantity = storedQuantity(line);
    return quantity !== null && line.manufacturerId ? [{ materialId: line.materialId, uoMId: line.unitId, manufacturerId: line.manufacturerId, purchaseOrderId: line.orderId,
      expectedQuantity: line.remaining, receivedQuantity: quantity, reason: line.reason.trim() }] : []; }) };
}
