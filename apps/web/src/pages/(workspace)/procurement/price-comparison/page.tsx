import { PriceComparison } from "@/modules/price-comparison/components/price-comparison";
import { viewComparisonPermissions } from "@/modules/price-comparison/lib/comparison-access";
import { NoAccess } from "@/shared/auth/no-access";
import { SupplierTypeSwitch, useSupplierTypeTabs } from "@/shared/procurement/supplier-type";

export default function PriceComparisonPage() {
  const types = useSupplierTypeTabs(viewComparisonPermissions);
  if (types.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Price comparison</h1></div>
      <SupplierTypeSwitch tabs={types} />
    </div>
    {/* Foreign and local quotes are awarded separately, so switching type starts the choices afresh. */}
    <PriceComparison key={types.kind} type={types.kind} />
  </section>;
}
