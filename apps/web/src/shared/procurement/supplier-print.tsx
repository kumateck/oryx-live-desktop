import type { SupplierContact } from "./supplier-summary";

/** Who a printed request is addressed to. */
export function SupplierPrintBlock({ supplier }: { supplier: SupplierContact }) {
  return <div className="print-note"><strong>To: {supplier.name}</strong>
    {[supplier.contactPerson, supplier.email, supplier.contactNumber, supplier.country].filter(Boolean).map((line) => <div key={line}>{line}</div>)}</div>;
}
