import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { PageHeader } from "@/shared/navigation/page-header";
import { reportPermissions, type ReportGroup } from "../lib/report-model";
const groups: { group: ReportGroup; title: string; path: string }[] = [
  { group: "warehouse", title: "Warehouse", path: "warehouse-report" }, { group: "procurement", title: "Procurement", path: "procurement-report" },
  { group: "finished-goods", title: "Finished goods", path: "finish-goods-transfernote-report" }, { group: "stores", title: "General stores", path: "store-inventory-report" },
  { group: "hr", title: "Human resources", path: "human-resources-report" }, { group: "quality", title: "Quality control and assurance", path: "qc-qa-reports" },
];
export function ReportIndex() {
  const access = useAccess();
  return <article className="space-y-4"><PageHeader title="Reports" crumbs={[{ label: "Reports" }]} />
    <p className="text-sm text-muted-foreground">Generate a complete snapshot, inspect all fields, and print or export it with the applied filters.</p>
    <div className="flex flex-wrap gap-3">{groups.filter((entry) => access.has(reportPermissions[entry.group])).map((entry) => <Button asChild variant="outline" key={entry.group}><Link to={`/reports/${entry.path}`}>{entry.title}</Link></Button>)}</div>
  </article>;
}
