import { Building2, Globe, Mail, Phone, User } from "lucide-react";

export interface SupplierContact { name: string; email: string | null; contactPerson: string | null; contactNumber: string | null; country: string | null; currency: string | null }

/** Who a request goes to, shown at the top of the dialog that sends it or records the reply. */
export function SupplierSummary({ supplier }: { supplier: SupplierContact }) {
  return <div className="min-w-0 rounded-md border bg-muted/50 p-3">
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 font-semibold"><Building2 className="size-4 shrink-0" /><span className="break-words">{supplier.name}</span></span>
      {supplier.currency ? <span className="shrink-0 text-sm text-muted-foreground">Prices in {supplier.currency}</span> : null}
    </div>
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {supplier.contactPerson ? <span className="flex items-center gap-1"><User className="size-3" />{supplier.contactPerson}</span> : null}
      <span className="flex items-center gap-1 break-all"><Mail className="size-3" />{supplier.email ?? "No email address"}</span>
      {supplier.contactNumber ? <span className="flex items-center gap-1"><Phone className="size-3" />{supplier.contactNumber}</span> : null}
      {supplier.country ? <span className="flex items-center gap-1"><Globe className="size-3" />{supplier.country}</span> : null}
    </div>
  </div>;
}
