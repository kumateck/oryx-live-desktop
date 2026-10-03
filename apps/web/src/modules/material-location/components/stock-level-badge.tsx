import { Badge } from "@/components/ui/badge";
import { stockLevelLabels, type StockLevel } from "../lib/stock-level";

export function StockLevelBadge({ level }: { level: StockLevel }) {
  if (level === "critical") return <Badge variant="destructive">{stockLevelLabels.critical}</Badge>;
  if (level === "low") return <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400">{stockLevelLabels.low}</Badge>;
  if (level === "optimal") return <Badge variant="outline" className="border-emerald-500/60 text-emerald-700 dark:text-emerald-400">{stockLevelLabels.optimal}</Badge>;
  return <span className="text-xs text-muted-foreground">{stockLevelLabels.unset}</span>;
}
