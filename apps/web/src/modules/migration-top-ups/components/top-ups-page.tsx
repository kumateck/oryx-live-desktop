import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { StockMigrationHistory } from "@/modules/upload-center/components/stock-migration-history";
import { StockMigrationPage } from "@/modules/upload-center/components/stock-migration-page";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { PageHeader } from "@/shared/navigation/page-header";
import { newTopUpPath, topUpPath, topUpPermissions, topUpsPath } from "../lib/top-up";

/** The department's migration stock top-ups: drafts waiting for approval and approved ones. */
export function TopUpsPage() {
  const user = useCurrentUser();
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Migration stock top-ups" crumbs={[{ label: "Warehouse" }, { label: "Migration stock top-ups" }]}
      actions={<PermissionGuard require={topUpPermissions.upload}><Button asChild size="sm"><Link to={newTopUpPath}><Plus />New top-up</Link></Button></PermissionGuard>} />
    <p className="text-sm text-muted-foreground">Stock that was in the stores at go-live but missed by the opening-balance count. Each top-up is checked and approved before its lots are added; existing stock is never changed.</p>
    {user?.departmentId ? <StockMigrationHistory departmentId={user.departmentId} topUp openPath={topUpPath} />
      : <p role="alert" className="rounded-md border p-3 text-sm">Your account is not in a department, so there are no department stores to show.</p>}
  </div>;
}

/** One top-up: its checked lines, the stock before and after, and approval. */
export function TopUpDetailPage() {
  return <StockMigrationPage home={{ path: topUpsPath, label: "Back to migration top-ups" }} />;
}
