import { StockReportPreview } from "./stock-report-preview";
import type { MaterialHeader } from "./approved-material-detail";

/** Complete bin-card report from the same snapshot used for stock reconciliation. */
export function BinCardPrint({ material, departmentId, search, onClose }: { material: MaterialHeader; departmentId: string; search: string; onClose: () => void }) {
  return <StockReportPreview material={material} departmentId={departmentId} view="bin-card" search={search} onClose={onClose} />;
}
