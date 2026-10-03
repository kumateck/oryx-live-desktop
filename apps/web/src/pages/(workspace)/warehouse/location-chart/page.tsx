import { LocationChart } from "@/modules/location-chart/components/location-chart";
import { locationChartPermissions } from "@/modules/location-chart/lib/location-access";
import { NoAccess } from "@/shared/auth/no-access";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";

export default function LocationChartPage() {
  const kinds = useKindTabs(locationChartPermissions);
  if (kinds.kind === null) return <NoAccess />;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Location chart</h1></div>
      <KindSwitch tabs={kinds.tabs} kind={kinds.kind} onSelect={kinds.select} />
    </div>
    {/* Each kind has its own racks, so switching kind starts the chart afresh. */}
    <LocationChart key={kinds.kind} kind={kinds.kind} />
  </section>;
}
