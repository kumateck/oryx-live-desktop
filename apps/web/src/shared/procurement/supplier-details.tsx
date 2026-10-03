import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import type { SupplierRecord } from "./supplier-schema";
import { supplierTypeLabels } from "./supplier-type";

/** Everything recorded about who supplied the goods: the company, who to reach, where they are, and the currency they are paid in. */
export function SupplierDetails({ supplier, title = "Supplier" }: { supplier: SupplierRecord; title?: string }) {
  return <DetailGroup title={title}>
    <DetailItem label="Company" value={supplier.name} />
    <DetailItem label="Kind" value={supplier.type === null ? null : `${supplierTypeLabels[supplier.type]} supplier`} />
    <DetailItem label="Contact person" value={supplier.contactPerson} />
    <DetailItem label="Email" value={supplier.email} />
    <DetailItem label="Phone" value={supplier.contactNumber} />
    <DetailItem label="Country" value={[supplier.country, supplier.countryCode ? `(${supplier.countryCode})` : null].filter(Boolean).join(" ")} />
    <DetailItem label="Address" value={supplier.address} />
    <DetailItem label="Currency" value={[supplier.currencyName, supplier.currency && supplier.currency !== supplier.currencyName ? `(${supplier.currency})` : null].filter(Boolean).join(" ")} />
  </DetailGroup>;
}
