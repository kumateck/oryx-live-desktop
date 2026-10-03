import type { DomainEntitiesProcurementSuppliersSupplierDto } from "@/shared/api/generated/procurement";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { supplierStatus, supplierType } from "../lib/supplier-access";
import { daysUntil, dueText } from "@/shared/format/due-dates";

const link = "text-primary underline-offset-2 hover:underline";
const person = (user: { firstName?: string | null; lastName?: string | null } | undefined) => `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || null;

/** Who the supplier is, how to reach it, and where its qualification stands. */
export function SupplierOverviewTab({ supplier }: { supplier: DomainEntitiesProcurementSuppliersSupplierDto }) {
  const email = supplier.email?.trim();
  const phone = supplier.contactNumber?.trim();
  const requalification = daysUntil(supplier.requalificationDueDate);
  return <div className="grid min-w-0 gap-4 lg:grid-cols-2">
    <DetailGroup title="Company">
      <DetailItem label="Name" value={supplier.name} />
      <DetailItem label="Type" value={supplierType(supplier.type)} />
      <DetailItem label="Country" value={supplier.country?.name} />
      <DetailItem label="Trading currency" value={supplier.currency?.name ? `${supplier.currency.name}${supplier.currency.symbol ? ` (${supplier.currency.symbol})` : ""}` : null} />
      <DetailItem label="Address" value={supplier.address?.trim() ? <span className="whitespace-pre-line">{supplier.address.trim()}</span> : null} />
    </DetailGroup>
    <DetailGroup title="Main contact">
      <DetailItem label="Contact person" value={supplier.contactPerson} />
      <DetailItem label="Email" value={email ? <a className={link} href={`mailto:${email}`}>{email}</a> : null} />
      <DetailItem label="Phone" value={phone ? <a className={link} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : null} />
    </DetailGroup>
    <DetailGroup title="Qualification">
      <DetailItem label="Status" value={supplierStatus(supplier.status)} />
      <DetailItem label="Approved on" value={formatDate(supplier.approvedAt)} />
      <DetailItem label="Requalification due" value={supplier.requalificationDueDate
        ? `${formatDate(supplier.requalificationDueDate) ?? ""}${requalification !== null ? ` (${dueText(requalification)})` : ""}` : null} />
    </DetailGroup>
    <DetailGroup title="Record">
      <DetailItem label="Created" value={formatDateTime(supplier.createdAt)} />
      <DetailItem label="Created by" value={person(supplier.createdBy)} />
    </DetailGroup>
  </div>;
}
